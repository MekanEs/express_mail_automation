import { ImapFlow } from 'imapflow';
import { handleError } from '../../../utils/error-handler';

export async function connectClient(client: ImapFlow) {
    try {
        await client.connect();
        return true
    } catch (err) {
        handleError(err, 'Ошибка при подключении к почте:', 'connectClient');
        return false
    }
}
