import { DeepPartial } from '../Types/deepPartial';

export interface ImportedJsonFileList<T> { [fileName: string]: Array<DeepPartial<T>> }
