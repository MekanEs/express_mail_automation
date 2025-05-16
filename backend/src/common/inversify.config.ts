import { Container } from "inversify";
import { TYPES } from "./types.di";

// Import all service interfaces and classes that have been refactored
// Example:
// import { IMyService, MyService } from "../services/my.service";
// import { IOtherService, OtherService } from "../services/subdir/other.service";
import { IFileSystemService, FileSystemService } from "../services/process/utils/fileSystem.service";
import { IBrowserInteractionService, BrowserInteractionService } from "../services/process/browser/browserInteraction.service";
import { IReportService, ReportService } from "../services/process/utils/report.service";
import { IEmailContentService, EmailContentService } from "../services/process/email/emailContent.service";
import { IAccountProcessingService, AccountProcessingService } from "../services/process/accountProcessing.service";

// Imports for AccountProcessingService dependencies (will be uncommented as they are refactored)
import { IImapClientService, ImapClientService } from "../services/process/client/imapClient.service";
import { ISpamHandlingService, SpamHandlingService } from "../services/process/mailbox/spamHandling.service";
import { ISearchMessagesService, SearchMessagesService } from "../services/process/email/searchMessages.service";
import { IReplyService, ReplyService } from "../services/process/reply/reply.service";
import { IMailboxDiscoveryService, MailboxDiscoveryService } from "../services/process/mailbox/mailboxDiscovery.service";
import { IProcessOrchestrationService, ProcessOrchestrationService } from "../services/process/processOrchestration.service";

const container = new Container();

// Bind services
// Example:
// container.bind<IMyService>(TYPES.MyService).to(MyService).inSingletonScope();
// container.bind<IOtherService>(TYPES.OtherService).to(OtherService).inSingletonScope();
container.bind<IFileSystemService>(TYPES.FileSystemService).to(FileSystemService).inSingletonScope();
container.bind<IBrowserInteractionService>(TYPES.BrowserInteractionService).to(BrowserInteractionService).inSingletonScope();
container.bind<IReportService>(TYPES.ReportService).to(ReportService).inSingletonScope();
container.bind<IEmailContentService>(TYPES.EmailContentService).to(EmailContentService).inSingletonScope();
container.bind<IAccountProcessingService>(TYPES.AccountProcessingService).to(AccountProcessingService).inSingletonScope();

// Bindings for AccountProcessingService dependencies (will be uncommented as they are refactored)
container.bind<IImapClientService>(TYPES.ImapClientService).to(ImapClientService).inSingletonScope();
container.bind<ISpamHandlingService>(TYPES.SpamHandlingService).to(SpamHandlingService).inSingletonScope();
container.bind<ISearchMessagesService>(TYPES.SearchMessagesService).to(SearchMessagesService).inSingletonScope();
container.bind<IReplyService>(TYPES.ReplyService).to(ReplyService).inSingletonScope();
container.bind<IMailboxDiscoveryService>(TYPES.MailboxDiscoveryService).to(MailboxDiscoveryService).inSingletonScope();
container.bind<IProcessOrchestrationService>(TYPES.ProcessOrchestrationService).to(ProcessOrchestrationService).inSingletonScope();

export { container };
