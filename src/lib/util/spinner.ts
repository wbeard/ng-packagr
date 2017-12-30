import * as ora from 'ora';

const TASKS = new Map<string, any>();

export const taskStarts = (id: string, label: string = id) => {
  const spinner = ora(label);
  TASKS.set(id, spinner);
  spinner.start();
};

export const taskCompleted = (id: string) => {
  const spinner = TASKS.get(id);
  if (spinner) {
    spinner.succeed();
  }
};
