import { useGenericQuery } from '@/services/useGenericQuery';
import { useGenericMutation } from '@/services/useGenericMutation';
import { Drug } from '@repo/store';
import { DrugApi } from './drug.api';

export const useAllDrugs = () =>
  useGenericQuery({
    queryKey: ['drugs'],
    queryFn: () => DrugApi.getAll(),
  });

export const useDrugWithDid = (did: number) =>
  useGenericQuery({
    queryKey: ['drug', did],
    queryFn: () => DrugApi.getByDid(did),
    enabled: !!did,
  });

// Update
export const useUpdateDrug = () => {
  return useGenericMutation({
    mutationFn: (data: Drug) => DrugApi.update(data),
    invalidateQueries: [['drug']],
  });
};
