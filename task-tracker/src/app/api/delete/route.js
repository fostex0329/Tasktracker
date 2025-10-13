// タスク削除API
export async function POST(request) {
  try {
    const data = await request.json();
    const id = data?.id;

    if (!id || typeof id !== "string") {
      return Response.json({ error: "無効なIDです" }, { status: 400 });
    }

    // 本サンプルでは永続層を持たないため、
    // クライアント側での削除に成功させるためのダミー応答のみ返す。
    return Response.json({ ok: true, id });
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}


