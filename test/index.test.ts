import { describe, it, expect } from 'vitest';
import { I18n } from '../src/index';

describe('i18n', () => {
  const en = {
    hello: 'Hello',
    goodbye: 'Goodbye',
    greeting: (name: string): string => `Hello, ${name}`,
    greetingNested: (name: string): string => `${en.hello}, ${name}`,
    plural: (value: number): string => `${I18n.plural(value, 'apple')}`,
  };

  const ru = {
    hello: 'Привет',
    goodbye: 'Пока',
    greeting: (name: string): string => `Привет, ${name}`,
    greetingNested: (name: string): string => `${ru.hello}, ${name}`,
    plural: (value: number): string => `${I18n.plural(value, ['яблоко', 'яблока', 'яблок'])}`,
  };

  type Lang = 'en' | 'ru';
  type Translations = typeof en & typeof ru;

  const t = new I18n<Lang, Translations>().addLocale('en', en).addLocale('ru', ru);

  it('common', () => {
    t.setLocale('en');
    expect(t.trans.hello).eql('Hello');

    t.setLocale('ru');
    expect(t.trans.hello).eql('Привет');
  });

  it('interpolation', () => {
    t.setLocale('en');
    expect(t.trans.greeting('Bro')).eql('Hello, Bro');

    t.setLocale('ru');
    expect(t.trans.greeting('Бро')).eql('Привет, Бро');
  });

  it('nesting', () => {
    t.setLocale('en');
    expect(t.trans.greetingNested('Bro')).eql('Hello, Bro');

    t.setLocale('ru');
    expect(t.trans.greetingNested('Бро')).eql('Привет, Бро');
  });

  it('plural', () => {
    t.setLocale('en');
    expect(t.trans.plural(1)).eql('1 apple');
    expect(t.trans.plural(2)).eql('2 apples');
    expect(t.trans.plural(5)).eql('5 apples');

    t.setLocale('ru');
    expect(t.trans.plural(1)).eql('1 яблоко');
    expect(t.trans.plural(2)).eql('2 яблока');
    expect(t.trans.plural(5)).eql('5 яблок');
  });
});
