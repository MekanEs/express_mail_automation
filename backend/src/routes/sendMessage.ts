import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import SG, { ResponseError } from '@sendgrid/mail'
const router = Router();
SG.setApiKey(process.env.SENDGRID_API_KEY || '');

// для резервного аккаунта
// const msg: SG.MailDataRequired = {
//     to: 'mekanesenjanow@gmail.com',
//     from: '??@em8327.promo-gizbo.email',
//     subject: 'Sending with Twilio SendGrid',
//     text: 'and easy to do anywhere, even with Node.js',
//     html: '<strong>and easy to do anywhere, even with Node.js</strong>',
//     replyToList: '??',
//     headers: '??'
// };

router.post('/', asyncHandler(async (req, res) => {
    try {
        // const result = await SG.send(msg);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error: unknown) {
        console.error(error);

        if (error instanceof ResponseError) {
            console.error(error.response.body);
        }

        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
}));


export default router;
