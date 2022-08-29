import { DeepPartial } from '../Types/deepPartial';

export interface JsonImportedObjectFileList<T> { [fileName: string]: Array<DeepPartial<T>> }
