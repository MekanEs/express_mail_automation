import { Account, ProcessConfig } from './types';

export interface ProcessJobData {
  process_id: string;
  accounts: Omit<Account, 'is_selected'>[];
  emails: string[];
  config: ProcessConfig;
  baseOutputPath: string;
  headlessMode?: boolean;
}
