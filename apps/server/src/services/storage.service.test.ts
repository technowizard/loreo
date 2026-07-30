import { describe, expect, it } from 'vitest';

import { storageService } from './storage.service.js';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('storageService.uploadImage', () => {
  it('rejects non-image bytes even when the filename looks like a png', async () => {
    await expect(
      storageService.uploadImage(Buffer.from('not-an-image'), 'fake.png', 'test-user', 'uploads')
    ).rejects.toThrow('File is not a supported image format');
  });

  it('accepts image bytes even when the filename extension is wrong', async () => {
    const result = await storageService.uploadImage(
      Buffer.concat([pngSignature, Buffer.from('fake image payload')]),
      'fake.txt',
      'test-user',
      'uploads'
    );

    expect(result.key).toContain('.png');
    expect(result.key).toContain('user-test-user/uploads/');

    await storageService.deleteFile(result.key);
  });
});
