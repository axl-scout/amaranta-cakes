import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** A detail view's record id mirrored in the URL (?key=recXXXX). Other params are kept; setting null removes it. */
export function useUrlParam(key: string): [string | null, (v: string | null) => void] {
  const [sp, setSp] = useSearchParams();
  const value = sp.get(key);
  const set = useCallback((v: string | null) => {
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      if (v) n.set(key, v); else n.delete(key);
      return n;
    }, { replace: false });
  }, [key, setSp]);
  return [value, set];
}
