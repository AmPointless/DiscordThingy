/**
 * Created by Pointless on 15/07/17.
 */
export const CategorySymbol = Symbol('Category');

export default function Category(categoryName: string) {
  return Reflect.metadata(CategorySymbol, categoryName);
}
