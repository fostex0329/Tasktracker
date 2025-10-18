// タスク編集API
const MAX_NOTE_LENGTH = 280;

export async function POST(request) {
  try {
    const data = await request.json();
    const id = data?.id;
    const name = typeof data?.name === "string" ? data.name.trim() : undefined;
    const rawRemindAt = data?.remindAt ?? undefined; // null を明示的に許容
    const rawNote = data?.note ?? undefined;

    if (!id || typeof id !== "string") {
      return Response.json({ error: "無効なIDです" }, { status: 400 });
    }

    if (name !== undefined && name.length === 0) {
      return Response.json({ error: "タスク名が空です" }, { status: 400 });
    }

    let remindAt = undefined; // undefined: 変更なし, null: 解除, string: ISO
    if (rawRemindAt !== undefined) {
      if (rawRemindAt === null || rawRemindAt === "") {
        remindAt = null; // 解除
      } else {
        // 正規化: クライアントからは ISO も "YYYY-MM-DDTHH:mm" も来る可能性があるため、
        // どちらも Date で受けて ISO(UTC) に統一して返す。
        const dt = new Date(rawRemindAt);
        if (Number.isNaN(dt.getTime())) {
          return Response.json({ error: "無効な日時です" }, { status: 400 });
        }
        // 過去の日時を許容するかはユースケースによる。ここでは許容。
        remindAt = dt.toISOString();
      }
    }

    let note = undefined;
    if (rawNote !== undefined) {
      if (rawNote === null) {
        note = null;
      } else if (typeof rawNote === "string") {
        const trimmedNote = rawNote.trim();
        if (trimmedNote.length > MAX_NOTE_LENGTH) {
          return Response.json({ error: `メモは${MAX_NOTE_LENGTH}文字以内で入力してください` }, { status: 400 });
        }
        note = trimmedNote.length > 0 ? trimmedNote : null;
      } else {
        return Response.json({ error: "メモは文字列で指定してください" }, { status: 400 });
      }
    }

    // サンプル実装: 永続層は持たないため、正規化したフィールドを返すのみ。
    return Response.json({
      id,
      ...(name !== undefined ? { name } : {}),
      ...(rawRemindAt !== undefined ? { remindAt } : {}),
      ...(rawNote !== undefined ? { note } : {}),
    });
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
