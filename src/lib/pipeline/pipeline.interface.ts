import { ProgressState } from './progress-state.interface';

export interface Pipeline {
  id: string,
  progress: ProgressState
  children: Pipeline[]
}
