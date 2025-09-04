import { E2eKeyType } from '@/selectors';

function generateE2eId(path: E2eKeyType, identifier = ''): string {
  return [...path.split('.'), identifier].filter(Boolean).join('-');
}

export const generateE2eSelector = (key: E2eKeyType, identifier?: string) => {
  return `[data-e2e="${generateE2eId(key, identifier)}"]`;
};

/**
 * Tạo selector cho thuộc tính href, ví dụ: href="..."
 * @param href giá trị của thuộc tính href
 * @returns selector dạng [href="..."]
 */
export function generateHrefSelector(href: string): string {
  return `[href="${href}"]`;
}


