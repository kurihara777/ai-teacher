import Link from 'next/link';

export default function Home() {
  return (
    <>
    <div className="text-2xl font-bold text-center my-6">
      学習支援に特化したAIサービスを提供します。
    </div>
    <hr />
    <div>
      <p className="text-2xl text-center my-10">初めての方</p>
      <p className="text-2xl text-center my-6 underline">
        <Link className="text-blue-500" href="/signup">新規登録</Link>
      </p>
    </div>
    <div>
      <p className="text-2xl text-center my-10">ユーザー登録済の方</p>
      <p className="text-2xl text-center my-6 underline">
        <Link className="text-blue-500" href="/login">ログイン</Link>
      </p>
    </div>
    </>
  );
}
