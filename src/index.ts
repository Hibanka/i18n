import pluralize from 'pluralize';

const THIS_REGEX = /\$this[\d.a-z|]+/g;

export class I18n<L extends string, T> {
  private locale!: L;
  private args: Argument[] = [];
  public transMap = new Map<L, Trans<T>>();

  public addLocale(lang: L, trans: Trans<T>): this {
    const interop = this.transform(trans);
    this.transMap.set(lang, interop);
    return this;
  }

  public setLocale(locale: L): this {
    this.locale = locale;
    return this;
  }

  public get trans(): T {
    if (this.transMap.size === 0) {
      throw new Error('Please add at least one locale');
    }

    if (!this.locale) {
      const locale = this.transMap.keys().next().value;
      console.warn(`i18n: falling back to ${locale}`);
      this.locale = locale;
    }

    return new Proxy(this.getCurrentTransmap(), this.getTransProxyHandler());
  }

  private transform<T extends TransFnWithKey>(obj: T): Trans<T> {
    return Object.keys(obj).reduce((car, key) => {
      const value = (obj as any)[key];

      if (typeof value === 'string') {
        return { ...car, [key]: value };
      }

      if (typeof value === 'object') {
        return { ...car, [key]: this.transform(value) };
      }

      if (typeof value === 'function') {
        return { ...car, [key]: value };
      }

      return { ...car, [key]: value() };
    }, {} as T);
  }

  private get(obj: any, path: string): any {
    return path.split('.').reduce((car, key) => car[key], obj);
  }

  private getTransProxyHandler(): {
    get: (trans: any, field: string) => typeof Proxy | string | (() => unknown);
  } {
    return {
      get: (trans: any, field: string): typeof Proxy | string | (() => unknown) => {
        const args = this.args;
        const value: string | object | (() => unknown) = trans[field];

        if (typeof value === 'object') {
          return new Proxy(value, this.getTransProxyHandler());
        }

        if (typeof value === 'function') {
          return value;
        }

        this.args = [];

        const argsFilled: string = args.reduce(
          (car, arg, index) => car.replace(`$${index + 1}`, arg),
          trans[field],
        );
        if (!argsFilled) {
          throw new Error(`Translations is missing with key: ${field}`);
        }

        const thisArgs = argsFilled.match(THIS_REGEX);
        if (!thisArgs) {
          return argsFilled;
        }

        return thisArgs.reduce((car, thisArg) => {
          if (thisArg.endsWith('.')) {
            const variable = this.get(this.getCurrentTransmap(), thisArg.slice(0, -1).replace('$this.', ''));
            return `${car.replace(thisArg, variable)}.`;
          }

          const variable = this.get(this.getCurrentTransmap(), thisArg.replace('$this.', ''));
          return car.replace(thisArg, variable);
        }, value);
      },
    };
  }

  private getCurrentTransmap(): NonNullable<Trans<T>> {
    return this.transMap.get(this.locale)!;
  }

  public static createLocale<T>(trans: Trans<T>): Trans<T> {
    return trans;
  }

  public static plural(value: number, word: string | [string, string, string]): string {
    if (Array.isArray(word)) {
      const forms = word;

      const getNounPluralForm = (a: number): number => {
        if (a % 10 === 1 && a % 100 !== 11) {
          return 0;
        } else if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) {
          return 1;
        } else {
          return 2;
        }
      };

      return `${value} ${forms[getNounPluralForm(value)]}`;
    } else {
      return pluralize(word, value, true);
    }
  }
}

type TransFn = (...args: any[]) => string;

interface TransFnWithKey {
  [key: string]: string | TransFn | TransFnWithKey;
}

type Trans<T> = object & T & TransFnWithKey;

type Argument = string | number;
