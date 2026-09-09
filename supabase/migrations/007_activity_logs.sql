-- 007_activity_logs.sql
-- Activity Log system for admin action tracking

-- Create activity_logs table
CREATE TABLE alumni_v2.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES alumni_v2.users(id),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_name text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_created_at ON alumni_v2.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON alumni_v2.activity_logs(action);
CREATE INDEX idx_activity_logs_admin_id ON alumni_v2.activity_logs(admin_id);

-- Enable RLS
ALTER TABLE alumni_v2.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view activity logs"
  ON alumni_v2.activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert activity logs
CREATE POLICY "Admins can insert activity logs"
  ON alumni_v2.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete activity logs (for cleanup)
CREATE POLICY "Admins can delete activity logs"
  ON alumni_v2.activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add log_retention_years to organization_info
ALTER TABLE alumni_v2.organization_info
ADD COLUMN IF NOT EXISTS log_retention_years integer DEFAULT 0;
