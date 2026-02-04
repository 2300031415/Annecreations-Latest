
import { useEffect } from 'react';
import { useCategoryStore } from '@/Store/categoryStore';

const useCategory = () => {
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const isCategoriesLoading = useCategoryStore((state) => state.isCategoriesLoading);
  const error = useCategoryStore((state) => state.error);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isCategoriesLoading,
    error,
  };
};

export default useCategory;
