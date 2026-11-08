import { TestEnvironment } from 'jest-environment-puppeteer';
class CustomEnvironment extends TestEnvironment {
    async setup() {
        await super.setup();
        if (this.global.context && this.global.context.isIncognito === undefined) {
            this.global.context.isIncognito = () => false;
        }
    }
}
export default CustomEnvironment;
