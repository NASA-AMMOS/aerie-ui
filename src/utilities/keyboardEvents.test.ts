import { describe, expect, test, vi } from 'vitest';
import { isDeleteEvent, isSaveEvent } from './keyboardEvents';

describe('isDeleteEvent', () => {
  test('Should correctly determine if the current key presses equate to a "Delete" event or not', () => {
    expect(isDeleteEvent(new KeyboardEvent('keydown', { key: 'Delete' }))).toEqual(true);
    expect(isDeleteEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))).toEqual(true);

    expect(isDeleteEvent(new KeyboardEvent('keydown', { key: 'A' }))).toEqual(false);
    expect(isDeleteEvent(new KeyboardEvent('keydown', { key: 'Enter' }))).toEqual(false);
  });
});

describe('isSaveEvent', () => {
  test('Should correctly determine if the current key presses equate to a "Save" event or not', () => {
    expect(isSaveEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 's' }))).toEqual(true);

    expect(isSaveEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'a' }))).toEqual(false);

    // check for Mac save events
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(isSaveEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }))).toEqual(true);

    expect(isSaveEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }))).toEqual(false);
  });
});
