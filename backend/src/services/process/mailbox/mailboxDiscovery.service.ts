import { ImapFlow, ListResponse } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { injectable } from 'inversify';
import "reflect-metadata";
import { Provider } from '../../../types/types';
import { COMMON_MAILBOX_NAMES, PROVIDER_SPECIFIC_MAILBOX_NAMES } from './constants';
import { getStandardMailboxConfig, gmailFallback, StandardMailboxKey } from './mailbox.config';



export type MailboxType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'spam' | 'newsletters';

// Define a type for the fallback logic function for _findSingleMailbox
// type SingleMailboxFallbackLogic = (
//   allMailboxes: ListResponse[],
//   user: string,
//   provider: Provider // Added provider for more context if needed by fallback
// ) => Promise<string | null>;

export type MailboxDiscoveryParams = { client: ImapFlow, user: string, provider: Provider, configuredPath?: string | null }

export interface IMailboxDiscoveryService {
  findInboxMailbox(params: MailboxDiscoveryParams): Promise<string | null>;
  findSentMailbox(params: MailboxDiscoveryParams): Promise<string | null>;
  findDraftMailbox(params: MailboxDiscoveryParams): Promise<string | null>;
  findTrashMailbox(params: MailboxDiscoveryParams): Promise<string | null>;
  findSpamMailbox(params: MailboxDiscoveryParams): Promise<string | null>;
  findNewsletterMailboxes(params: MailboxDiscoveryParams): Promise<string[]>;
}

@injectable()
export class MailboxDiscoveryService implements IMailboxDiscoveryService {
  // Кэш списков почтовых ящиков с ключами в формате clientId
  private mailboxesCache = new Map<string, ListResponse[]>();

  private async listMailboxesSafe(client: ImapFlow, user: string): Promise<ListResponse[]> {
    const cacheKey = client.id;
    if (this.mailboxesCache.has(cacheKey)) {
      return this.mailboxesCache.get(cacheKey)!;
    }

    try {
      const list = await client.list();
      this.mailboxesCache.set(cacheKey, list);
      return list
    } catch (err) {
      handleError(err, `[Mailbox Discovery] Не удалось получить список почтовых ящиков для ${user}`, 'listMailboxesSafe');
      return [];
    }
  }

  // Метод для принудительного обновления кэша
  public async refreshMailboxesCache(client: ImapFlow, user: string): Promise<ListResponse[]> {
    const cacheKey = client.id;
    this.mailboxesCache.delete(cacheKey);
    return this.listMailboxesSafe(client, user);
  }

  // Вспомогательный метод для поиска одного ящика по имени
  private findMailboxByName(
    allMailboxes: ListResponse[],
    nameVariants: string[],
    mailboxTypeForLog: string,
    user: string
  ): ListResponse | null {
    const lowerNameVariants = nameVariants.map(name => name.toLowerCase());
    const foundBox = allMailboxes.find(box =>
      lowerNameVariants.includes(box.path.toLowerCase())
    );
    if (foundBox) {
      logger.info(`[Mailbox Discovery] Найден ящик (по имени) '${mailboxTypeForLog}' для ${user}: ${foundBox.path}`, true);
    }
    return foundBox || null;
  }

  // Вспомогательный метод для поиска нескольких ящиков по имени
  private findMailboxesByNames(
    allMailboxes: ListResponse[],
    nameVariants: string[],
    mailboxTypeForLog: string,
    user: string
  ): ListResponse[] {
    const lowerNameVariants = nameVariants.map(name => name.toLowerCase());
    const foundBoxes = allMailboxes.filter(box =>
      lowerNameVariants.includes(box.path.toLowerCase()) || // Exact match
      lowerNameVariants.some(name => box.path.toLowerCase().endsWith('/' + name)) // Match subfolder like INBOX/Newsletters
    );
    if (foundBoxes.length > 0) {
      logger.info(`[Mailbox Discovery] Найдены ящики (по именам) для '${mailboxTypeForLog}' для ${user}: ${foundBoxes.map(b => b.path).join(', ')}`, true);
    }
    return foundBoxes;
  }

  private getEffectiveNameVariants(provider: Provider, mailboxType: MailboxType): string[] {
    const common = COMMON_MAILBOX_NAMES[mailboxType] || [];
    const specific = PROVIDER_SPECIFIC_MAILBOX_NAMES[provider]?.[mailboxType] || [];
    return Array.from(new Set([...specific, ...common]));
  }

  private async _findSingleMailbox(
    // client: ImapFlow, // Не используется напрямую, allMailboxes передаются
    params: MailboxDiscoveryParams,
    mailboxType: MailboxType,
    typeForLog: string,
    specialUseFlag: string | null,
    allMailboxes: ListResponse[],
    fallbackLogic?: (mailboxes: ListResponse[], user: string, provider: Provider) => Promise<string | null>
  ): Promise<string | null> {
    const { user, provider, configuredPath } = params;
    // 1. Поиск по сконфигурированному пути
    if (configuredPath) {
      const foundByConfig = allMailboxes.find(box => box.path === configuredPath);
      if (foundByConfig) {
        logger.info(`[Mailbox Discovery] ${typeForLog} для ${user} использован из конфигурации: ${configuredPath}`, true);
        return configuredPath;
      }
      logger.warn(`[Mailbox Discovery] ${typeForLog} путь '${configuredPath}' из конфигурации не найден для ${user}. Попытка автообнаружения.`, true);
    } else {
      logger.debug(`[Mailbox Discovery] Конфигурация для ${typeForLog} для ${user} не задана.`, true);
    }

    // 2. Поиск по SpecialUse флагу
    if (specialUseFlag) {
      const effectiveSpecialUseFlag = specialUseFlag;
      if (mailboxType === 'inbox' && provider === 'google' && specialUseFlag === '\\Inbox') {
        const foundByGoogleAll = allMailboxes.find(box => box.specialUse === '\\All');
        if (foundByGoogleAll) {
          logger.info(`[Mailbox Discovery] ${typeForLog} для ${user} (Google) найден по specialUse (\\All): ${foundByGoogleAll.path}`, true);
          return foundByGoogleAll.path;
        }
        logger.debug(`[Mailbox Discovery] ${typeForLog} для ${user} (Google) не найден по specialUse (\\All). Попытка ${specialUseFlag}.`, true);
      }

      const foundBySpecialUse = allMailboxes.find(box => box.specialUse === effectiveSpecialUseFlag);
      if (foundBySpecialUse) {
        logger.info(`[Mailbox Discovery] ${typeForLog} для ${user} найден по specialUse (${effectiveSpecialUseFlag}): ${foundBySpecialUse.path}`, true);
        return foundBySpecialUse.path;
      }
      logger.debug(`[Mailbox Discovery] ${typeForLog} для ${user} не найден по specialUse (${effectiveSpecialUseFlag}). Попытка поиска по имени.`, true);
    } else {
      logger.debug(`[Mailbox Discovery] SpecialUse флаг для ${typeForLog} для ${user} не применим. Попытка поиска по имени.`, true);
    }

    // 3. Поиск по имени
    const nameVariants = this.getEffectiveNameVariants(provider, mailboxType);
    const foundByName = this.findMailboxByName(allMailboxes, nameVariants, typeForLog, user);
    if (foundByName) {
      // Логирование успеха происходит в findMailboxByName
      return foundByName.path;
    }
    logger.debug(`[Mailbox Discovery] ${typeForLog} для ${user} не найден по стандартным именам (${nameVariants.join(', ')}). Попытка fallback логики.`, true);

    // 4. Fallback логика
    if (fallbackLogic) {
      const fallbackPath = await fallbackLogic(allMailboxes, user, provider);
      if (fallbackPath) {
        logger.info(`[Mailbox Discovery] ${typeForLog} для ${user} найден с помощью fallback логики: ${fallbackPath}`, true);
        return fallbackPath;
      }
      logger.debug(`[Mailbox Discovery] Fallback логика для ${typeForLog} для ${user} не дала результата.`, true);
    }

    logger.warn(`[Mailbox Discovery] Не удалось автоматически обнаружить ${typeForLog} для ${user} всеми доступными методами.`, true);
    return null;
  }

  private async _findStandardMailbox(
    params: MailboxDiscoveryParams,
    mailboxType: MailboxType,
    typeForLog: string,
    specialUseFlag: string | null
  ): Promise<string | null> {
    const allMailboxes = await this.listMailboxesSafe(params.client, params.user);
    const path = await this._findSingleMailbox(
      params,
      mailboxType,
      typeForLog,
      specialUseFlag,
      allMailboxes
    );

    if (!path) {
      logger.warn(`[Mailbox Discovery] Не удалось автоматически обнаружить ${typeForLog} для ${params.user}.`, true);
    }
    return path;
  }

  public async findInboxMailbox(params: MailboxDiscoveryParams): Promise<string | null> {
    const allMailboxes = await this.listMailboxesSafe(params.client, params.user);
    const mailboxType: MailboxType = 'inbox';
    const typeForLog = 'Inbox';



    const path = await this._findSingleMailbox(
      params, mailboxType, typeForLog, '\\Inbox', allMailboxes, gmailFallback
    );
    if (!path) {
      logger.warn(`[Mailbox Discovery] Не удалось автоматически обнаружить ${typeForLog} для ${params.user}. По умолчанию будет использован "INBOX".`, true);
      return 'INBOX'; // Critical mailbox
    }
    return path;
  }

  public async findSentMailbox(params: MailboxDiscoveryParams): Promise<string | null> {
    const configKey: StandardMailboxKey = 'sent';
    const config = getStandardMailboxConfig(configKey);
    return this._findStandardMailbox(params, config.mailboxType, config.typeForLog, config.specialUseFlag);
  }

  public async findDraftMailbox(params: MailboxDiscoveryParams): Promise<string | null> {
    const configKey: StandardMailboxKey = 'drafts';
    const config = getStandardMailboxConfig(configKey);
    return this._findStandardMailbox(params, config.mailboxType, config.typeForLog, config.specialUseFlag);
  }

  public async findTrashMailbox(params: MailboxDiscoveryParams): Promise<string | null> {
    const configKey: StandardMailboxKey = 'trash';
    const config = getStandardMailboxConfig(configKey);
    return this._findStandardMailbox(params, config.mailboxType, config.typeForLog, config.specialUseFlag);
  }

  public async findSpamMailbox(params: MailboxDiscoveryParams): Promise<string | null> {
    const configKey: StandardMailboxKey = 'spam';
    const config = getStandardMailboxConfig(configKey);
    return this._findStandardMailbox(params, config.mailboxType, config.typeForLog, config.specialUseFlag);
  }

  public async findNewsletterMailboxes(params: MailboxDiscoveryParams, configuredPaths?: string[] | null): Promise<string[]> {
    const allMailboxes = await this.listMailboxesSafe(params.client, params.user);
    const mailboxType: MailboxType = 'newsletters';
    const typeForLog = 'Рассылки/Новости';
    const foundPaths: string[] = [];

    if (configuredPaths && configuredPaths.length > 0) {
      const verifiedConfigPaths: string[] = [];
      for (const path of configuredPaths) {
        if (allMailboxes.some(box => box.path === path)) {
          verifiedConfigPaths.push(path);
        } else {
          logger.warn(`[Mailbox Discovery] ${typeForLog} путь '${path}' из конфигурации не найден для ${params.user}.`);
        }
      }
      if (verifiedConfigPaths.length > 0) {
        logger.info(`[Mailbox Discovery] ${typeForLog} для ${params.user} использованы из конфигурации: ${verifiedConfigPaths.join(', ')}`, true);
        foundPaths.push(...verifiedConfigPaths);
      } else {
        logger.warn(`[Mailbox Discovery] Все ${typeForLog} пути из конфигурации не найдены для ${params.user}. Попытка автообнаружения.`, true);
      }
    }

    const nameVariants = this.getEffectiveNameVariants(params.provider, mailboxType);
    const foundByNamesResponses = this.findMailboxesByNames(allMailboxes, nameVariants, typeForLog, params.user);

    const pathsFromNames = foundByNamesResponses.map(box => box.path);
    pathsFromNames.forEach(path => {
      if (!foundPaths.includes(path)) {
        foundPaths.push(path);
      }
    });

    if (foundPaths.length === 0) {
      logger.info(`[Mailbox Discovery] ${typeForLog} не обнаружены для ${params.user} (это может быть нормально).`, true);
    }
    return Array.from(new Set(foundPaths));
  }
}

