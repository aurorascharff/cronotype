export const FEATURED: string[] = [
  'gaearon',
  'sebmarkbage',
  'acdlite',
  'sophiebits',
  'rickhanlonii',
  'rauchg',
  'leerob',
  'shuding',
  'timneutkens',
  'styfle',
  'sindresorhus',
  'tj',
  'addyosmani',
  'paulirish',
  'mjackson',
  'ryanflorence',
  'kentcdodds',
  'wesbos',
  'sdras',
  'tannerlinsley',
  'tkdodo',
  'cassidoo',
  'jaredpalmer',
  'mxstbr',
  'kettanaito',
  'evanw',
  'developit',
  'antfu',
  'yyx990803',
  'rich-harris',
  'torvalds',
  'mitchellh',
  'kelseyhightower',
  'shadcn',
  'pacocoursey',
  'steveruizok',
];

const FEATURED_SET = new Set(FEATURED);

export function isFeaturedLogin(login: string): boolean {
  return FEATURED_SET.has(login.toLowerCase());
}
