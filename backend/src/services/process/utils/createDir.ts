import fs from 'fs';
import { handleError } from '../../../utils/error-handler';

export const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
            handleError(err, 'Ошибка создания папки:', 'createDir')
        }
    }
};
