import { TestEnvironment } from 'jest-environment-puppeteer';

class CustomEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();

    if ((this.global as any).context && (this.global as any).context.isIncognito === undefined) {
      (this.global as any).context.isIncognito = () => false;
    }
  }
}

export default CustomEnvironment;
