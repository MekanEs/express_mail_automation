// src/services/process/utils/fileSystem.service.ts
import fs from 'fs';
import path from 'path';
import { handleError } from '../../../utils/error-handler';
import { logger } from '../../../utils/logger';

export class FileSystemService {
  public createDirectoryIfNotExists(dirPath: string): boolean {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`[FS Service] Директория создана: ${dirPath}`);
        return true;
      } catch (err) {
        handleError(err, `[FS Service] Ошибка создания директории: ${dirPath}`, 'createDirectoryIfNotExists');
        return false;
      }
    }
    logger.debug(`[FS Service] Директория уже существует: ${dirPath}`);
    return true; // Директория уже существует
  }

  public deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        // fs.unlinkSync(filePath);
        logger.info(`[FS Service] Файл удален: ${filePath}`);
        return true;
      }
      logger.warn(`[FS Service] Попытка удалить несуществующий файл: ${filePath}`);
      return false; // Файл не найден, не ошибка, но и не удален
    } catch (err) {
      handleError(err, `[FS Service] Ошибка удаления файла: ${filePath}`, 'deleteFile');
      return false;
    }
  }

  public async cleanupDirectory(dirPath: string): Promise<void> {
    logger.info(`[FS Service] Начало очистки директории: ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
      logger.warn(`[FS Service] Директория для очистки не найдена: ${dirPath}`);
      return;
    }
    try {
      const files = await fs.promises.readdir(dirPath);
      if (files.length === 0) {
        logger.info(`[FS Service] Директория ${dirPath} пуста, очистка не требуется.`);
        return;
      }
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          // Проверяем, является ли это файлом или директорией
          const stat = await fs.promises.lstat(filePath);
          if (stat.isDirectory()) {
            // Если это директория, можно рекурсивно очистить или пропустить
            logger.warn(`[FS Service] Обнаружена поддиректория ${filePath} при очистке. Пропускаем.`);
            // Для рекурсивного удаления: await fs.promises.rm(filePath, { recursive: true, force: true });
          } else {
            await fs.promises.unlink(filePath);
            logger.debug(`[FS Service] Удален файл при очистке: ${filePath}`);
          }
        } catch (err) {
          handleError(err, `[FS Service] Не удалось удалить элемент ${filePath} при очистке директории ${dirPath}`, 'cleanupDirectory.unlink');
        }
      }
      logger.info(`[FS Service] Директория ${dirPath} успешно очищена (или предпринята попытка очистки).`);
    } catch (err) {
      handleError(err, `[FS Service] Ошибка при чтении директории ${dirPath} для очистки`, 'cleanupDirectory.readdir');
    }
  }
}

export const fileSystemService = new FileSystemService();
