import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Player } from "@/components/player";
import { Splash } from "@/components/splash";
import { findLesson, isUnlocked, lessonDrills } from "@/lib/curriculum";
import { useProgress, useStoreHydrated } from "@/lib/progress";

export const Route = createFileRoute("/lesson/$courseId/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { courseId, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const ready = useStoreHydrated();
  const completed = useProgress((state) => state.completed);
  const found = findLesson(lessonId);

  if (!ready) return <Splash />;

  if (!found || found.course.id !== courseId) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-4xl">Lição não encontrada</h1>
        <p className="mt-3 text-muted">Este caminho não existe no percurso.</p>
        <Link to="/" className="press mt-6 flex h-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-on-primary">
          Voltar
        </Link>
      </main>
    );
  }

  if (!isUnlocked(found.course, found.lesson.id, completed)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-4xl">Ainda fechada</h1>
        <p className="mt-3 text-muted">Completa a lição anterior para abrir esta.</p>
        <Link to="/" className="press mt-6 flex h-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-on-primary">
          Ver o percurso
        </Link>
      </main>
    );
  }

  return (
    <Player
      title={`${found.course.name} · ${found.lesson.title}`}
      drills={lessonDrills(found.course.id, found.lesson)}
      costHeart
      onExit={() => {
        void navigate({ to: "/" });
      }}
      onComplete={(stats) => useProgress.getState().completeLesson(found.lesson.id, stats.correct, stats.total)}
    />
  );
}
