import { createNoteInputSchema, noteService, toNoteDto } from "@/modules/example";
import { requireUser } from "@/platform/auth/session";
import { errorResponse } from "@/platform/errors";
import { parseJsonBody } from "@/platform/validation";

// A route does four things and nothing else: authenticate, validate, call the module, map the result.

export async function GET(request: Request): Promise<Response> {
  const user = await requireUser(request.headers);
  if (!user.ok) {
    return errorResponse(user.error);
  }

  const notes = await noteService.listNotes(user.value.id);
  return Response.json({ notes: notes.map(toNoteDto) });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser(request.headers);
  if (!user.ok) {
    return errorResponse(user.error);
  }

  const input = await parseJsonBody(request, createNoteInputSchema);
  if (!input.ok) {
    return errorResponse(input.error);
  }

  const result = await noteService.createNote(user.value, input.value);
  if (!result.ok) {
    return errorResponse(result.error);
  }
  return Response.json({ note: toNoteDto(result.value) }, { status: 201 });
}
