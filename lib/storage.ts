"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import type { PlannerState } from "./types";

export const initialPlannerState: PlannerState = {
  week: { Ma: [], Di: [], Wo: [], Do: [], Vr: [], Za: [], Zo: [] },
  weekPortions: {},
  shoppingList: [],
  checked: {},
  favorites: [],
};

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }
  } catch {
    // A bad deployment variable must never prevent the foodplanner from
    // rendering. Storage simply remains unavailable until it is corrected.
    return null;
  }

  return createClient(url, key);
}

export function usePlannerStorage() {
  const [state, setState] = useState<PlannerState>(initialPlannerState);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    const supabase = client();
    if (!supabase) {
      setReady(true);
      return;
    }
    void (async () => {
      try {
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const signIn = await supabase.auth.signInAnonymously();
          user = signIn.data.user;
        }
        if (!user) return;
        setUserId(user.id);
        const { data } = await supabase
          .from("foodplanner_state")
          .select("week, week_portions, shopping_list, checked, favorites")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setState({
            week: { ...initialPlannerState.week, ...data.week },
            weekPortions: data.week_portions || {},
            shoppingList: data.shopping_list || [],
            checked: data.checked || {},
            favorites: data.favorites || [],
          });
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready || !userId) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    const supabase = client();
    if (!supabase) return;
    const timeout = window.setTimeout(() => {
      void supabase.from("foodplanner_state").upsert({
        user_id: userId,
        week: state.week,
        week_portions: state.weekPortions,
        shopping_list: state.shoppingList,
        checked: state.checked,
        favorites: state.favorites,
        updated_at: new Date().toISOString(),
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [ready, state, userId]);

  return { state, setState, ready, storageConnected: Boolean(client()) };
}
