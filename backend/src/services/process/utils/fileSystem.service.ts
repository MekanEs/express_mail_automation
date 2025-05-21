import fs from 'fs';
import path from 'path';
import { injectable } from "inversify";
import "reflect-metadata"; // Recommended to be here or ensure it's imported globally
import { handleError } from '../../../utils/error-handler'; // Corrected path
import { logger } from '../../../utils/logger'; // Corrected path

// Вспомогательная функция для проверки существования файла
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface IFileSystemService {
  createDirectoryIfNotExists(dirPath: string): Promise<boolean>;
  deleteFile(filePath: string): Promise<boolean>;
  cleanupDirectory(dirPath: string): Promise<void>;
  cleanUpTempDirectory(tempDirectories: string[], process_id: string): Promise<void>;
}

@injectable()
export class FileSystemService implements IFileSystemService {
  public async createDirectoryIfNotExists(dirPath: string): Promise<boolean> {
    if (!fs.existsSync(dirPath)) {
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
        logger.debug(`[FS Service] Директория создана: ${dirPath}`);
        return true;
      } catch (err) {
        handleError(err, `[FS Service] Ошибка создания директории: ${dirPath}`, 'createDirectoryIfNotExists');
        return false;
      }
    }
    return true;
  }

  public async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (await fileExists(filePath)) {
        await fs.promises.unlink(filePath);
        logger.debug(`[FS Service] Файл удален: ${filePath}`);
        return true;
      } else {
        logger.warn(`[FS Service] Попытка удалить несуществующий файл: ${filePath}`, true);
        return false;
      }
    } catch (err) {
      handleError(err, `[FS Service] Ошибка удаления файла: ${filePath}`, 'deleteFile');
      return false;
    }
  }

  public async cleanupDirectory(dirPath: string): Promise<void> {
    logger.info(`[FS Service] Начало очистки директории: ${dirPath}`, true);
    if (!fs.existsSync(dirPath)) {
      logger.warn(`[FS Service] Директория для очистки не найдена: ${dirPath}`, true);
      return;
    }
    try {
      const files = await fs.promises.readdir(dirPath);
      if (files.length === 0) {
        logger.debug(`[FS Service] Директория ${dirPath} пуста, очистка не требуется.`);
        return;
      }
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          // Проверяем, является ли это файлом или директорией
          const stat = await fs.promises.lstat(filePath);
          if (stat.isDirectory()) {
            // Если это директория, можно рекурсивно очистить или пропустить
            logger.warn(`[FS Service] Обнаружена поддиректория ${filePath} при очистке. Пропускаем.`, true);
            // Для рекурсивного удаления: await fs.promises.rm(filePath, { recursive: true, force: true });
          } else {
            await fs.promises.unlink(filePath);
            logger.debug(`[FS Service] Файл удален при очистке: ${filePath}`);
          }
        } catch (err) {
          handleError(err, `[FS Service] Не удалось удалить элемент ${filePath} при очистке директории ${dirPath}`, 'cleanupDirectory.unlink');
        }
      }
      logger.info(`[FS Service] Директория ${dirPath} успешно очищена (или предпринята попытка очистки).`, true);
    } catch (err) {
      handleError(err, `[FS Service] Ошибка при чтении директории ${dirPath} для очистки`, 'cleanupDirectory.readdir');
    }
  }
  public async cleanUpTempDirectory(tempDirectories: string[], process_id: string): Promise<void> {
    for (const dirPath of tempDirectories) {
      try {
        await this.cleanupDirectory(dirPath);
        try {
          await fs.promises.rmdir(dirPath);
          logger.debug(`[Orchestration ID: ${process_id}] Удалена пустая директория ${dirPath}.`);
        } catch (rmdirErr) {
          handleError(rmdirErr, `[Orchestration ID: ${process_id}] Не удалось удалить директорию ${dirPath}`);
        }
      } catch (cleanupErr) {
        handleError(cleanupErr, `[Orchestration ID: ${process_id}] Ошибка при очистке директории ${dirPath}`);
      }
    }
  }
}

// export const fileSystemService = new FileSystemService(); // Original singleton export, now handled by DI
