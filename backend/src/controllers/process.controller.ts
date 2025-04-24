import { Request, Response } from 'express';
import { processMailbox } from '../services/process.service';
import { getConfig } from '../utils/getConfig';
import { accounts, from_email, ProcessRequestBody } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { supabaseClient } from '../clients/supabaseClient';

class ProcessController {
    public async processEmails(
        req: Request<
            Record<string, string>,
            Record<string, string>,
            ProcessRequestBody
        >,
        res: Response
    ): Promise<void> {
        const { 
            accounts, 
            emails, 
            limit = 20, 
            openRate = 10

        } = req.body;

        console.log('Запуск процесса с параметрами:');
        console.log('Accounts:', accounts.map((el) => el.email).join(', '));
        console.log('Emails:', emails);
        console.log('Limit:', limit);
        console.log('Open Rate:', openRate);

        const process_id = uuidv4();
        
        for (const account of accounts) {
            console.log(`✅ account ${account.email}`, account);
            const config = getConfig(account.provider ?? '');
            if (!config) {
                console.log(`Пропуск аккаунта ${account.email}: не найдена конфигурация для провайдера ${account.provider}`);
                continue;
            }
            
            for (const from_email of emails) {
                console.log(`✅✅ Обработка для ${account.email} от ${from_email}`);
                
                const processParams = {
                    process_id: process_id,
                    user: account.email || '',
                    from: from_email,
                    host: config.host,
                    mailboxes: config.mailboxes,
                    spam: config.spam,
                    limit: limit,
                    openRate: openRate,
                    outputPath: 'files',
                    ...(account.is_token
                        ? { token: account.access_token || '' }
                        : { password: account.app_password || '' })
                };
                
                try {
                    await processMailbox(processParams);
                } catch (error) {
                    console.error(`Ошибка при обработке ${account.email} от ${from_email}:`, error);
                }
            }
        }
        
        res.send({ process_id, message: 'Процесс запущен' });
        console.log(`Завершение запроса на запуск процесса ${process_id}`);
    }

    
}
export const processController = new ProcessController();
