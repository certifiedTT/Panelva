import { useState } from "react";

interface MutationConfig<T> {
  onMutate: () => T;
  onSuccess: (data: T) => void;
  onError: (error: any, rollbackState: T) => void;
  mutationFn: () => Promise<any>;
}

export function useOptimisticAction<T>(config: MutationConfig<T>) {
  const [state, setState] = useState<T>(config.onMutate);

  const trigger = async () => {
    const backupState = state;
    try {
      const nextState = config.onMutate();
      setState(nextState);

      await config.mutationFn();
      config.onSuccess(nextState);
    } catch (err) {
      setState(backupState);
      config.onError(err, backupState);
    }
  };

  return { state, trigger };
}
