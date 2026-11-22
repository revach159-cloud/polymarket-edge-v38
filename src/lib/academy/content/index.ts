export {
  AcademyCatalogSchema,
  CourseSchema,
  LessonBlockSchema,
  LessonSchema,
  ModuleSchema,
  type AcademyCatalog,
  type Course,
  type Lesson,
  type LessonBlock,
  type Module,
} from "@/lib/academy/content/schemas";

export {
  academyCatalog,
  countLessons,
  getCourseBySlug,
  listCourses,
} from "@/lib/academy/content/catalog";
