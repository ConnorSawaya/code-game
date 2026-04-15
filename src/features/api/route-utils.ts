import { createSupabaseServerClient } from "@/features/supabase/server";

export class RouteError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new RouteError("Authentication required", 401);
  }

  return user;
}

export function getErrorDetails(error: unknown) {
  if (error instanceof RouteError) {
    return {
      message: error.message,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 400,
    };
  }

  return {
    message: "Something went wrong.",
    status: 500,
  };
}
