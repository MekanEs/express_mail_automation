import path from 'path';
export const manageDirectories = (dirname: string, tempDirectories: string[], process_id: string, accountEmail: string, baseOutputPath: string) => {
    const projectRoot = path.resolve(dirname, '..', '..', '..');
    const uniqueSubfolder = `${process_id}_${accountEmail.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const tempDirPath = path.join(projectRoot, baseOutputPath, uniqueSubfolder);
    tempDirectories.push(tempDirPath);
    return tempDirPath;
}
