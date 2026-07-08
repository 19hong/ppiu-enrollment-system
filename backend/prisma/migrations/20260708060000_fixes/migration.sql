-- Add missing @updatedAt columns with default values for existing rows
ALTER TABLE "permissions" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payment_histories" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "notifications" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "documents" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "audit_logs" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add composite unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_resource_action_key" ON "permissions" ("resource", "action");
CREATE UNIQUE INDEX IF NOT EXISTS "course_prerequisites_courseId_prerequisiteCourseId_key" ON "course_prerequisites" ("courseId", "prerequisiteCourseId");
CREATE UNIQUE INDEX IF NOT EXISTS "enrollment_courses_enrollmentId_courseId_key" ON "enrollment_courses" ("enrollmentId", "courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "student_scholarships_studentId_scholarshipId_key" ON "student_scholarships" ("studentId", "scholarshipId");

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS "grades_studentId_courseId_semesterId_idx" ON "grades" ("studentId", "courseId", "semesterId");
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications" ("userId", "isRead");
CREATE INDEX IF NOT EXISTS "attendance_studentId_date_idx" ON "attendances" ("studentId", "date");
CREATE INDEX IF NOT EXISTS "schedule_classroomId_weekday_startTime_idx" ON "schedules" ("classroomId", "weekday", "startTime");
CREATE INDEX IF NOT EXISTS "schedule_lecturerId_weekday_startTime_idx" ON "schedules" ("lecturerId", "weekday", "startTime");
CREATE INDEX IF NOT EXISTS "payments_studentId_status_idx" ON "payments" ("studentId", "status");
CREATE INDEX IF NOT EXISTS "permissions_resource_action_idx" ON "permissions" ("resource", "action");
