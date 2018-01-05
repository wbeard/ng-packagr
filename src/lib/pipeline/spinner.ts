import * as ora from 'ora';
// import * as spinner from '../util/spinner';

export class SpinnerUi {

  private prefix: string;

  constructor(
    private spinner = ora('')
  ) {}

  next(value) {
    if (value.what === '⁄init⁄') {
      this.prefix = value.payload;
      this.spinner.start(`${this.prefix}: ${value.what}`);
    } else if (value.what === 'ωfinishesω') {
      this.spinner.succeed(`${this.prefix}: Build success.`);
    } else {
      this.spinner.text = `${this.prefix}: ${value.what}`;
    }
  }

  error(err) {
    this.spinner.fail(`${this.prefix}: ${err}`);
  }

  complete() {
  }

}
