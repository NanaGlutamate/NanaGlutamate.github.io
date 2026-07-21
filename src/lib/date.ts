export function formatDate(
  d: string,
  monthStyle: '2-digit' | 'long' = '2-digit',
): string {
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: monthStyle,
    day: monthStyle === 'long' ? 'numeric' : '2-digit',
  })
}
