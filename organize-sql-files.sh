#!/bin/bash

# Script to organize SQL files into proper directories
# Run this before production deployment

echo "🗂️  Organizing SQL files..."

# Create directories if they don't exist
mkdir -p supabase/debug
mkdir -p supabase/fixes
mkdir -p docs/archive

# Move debug SQL files
echo "Moving debug files..."
mv CHECK_*.sql supabase/debug/ 2>/dev/null
mv DEBUG_*.sql supabase/debug/ 2>/dev/null
mv TEST_*.sql supabase/debug/ 2>/dev/null
mv DIAGNOSE_*.sql supabase/debug/ 2>/dev/null
mv VERIFY_*.sql supabase/debug/ 2>/dev/null
mv SIMPLE_*.sql supabase/debug/ 2>/dev/null

# Move fix SQL files
echo "Moving fix files..."
mv FIX_*.sql supabase/fixes/ 2>/dev/null
mv APPLY_*.sql supabase/fixes/ 2>/dev/null
mv CLEAR_*.sql supabase/fixes/ 2>/dev/null
mv DROP_*.sql supabase/fixes/ 2>/dev/null
mv FORCE_*.sql supabase/fixes/ 2>/dev/null
mv FRESH_*.sql supabase/fixes/ 2>/dev/null
mv MANUAL_*.sql supabase/fixes/ 2>/dev/null
mv QUICK_FIX*.sql supabase/fixes/ 2>/dev/null
mv SECURE_*.sql supabase/fixes/ 2>/dev/null

# Move other SQL files
echo "Moving other SQL files..."
mv *_amanda_*.sql supabase/debug/ 2>/dev/null
mv compare_*.sql supabase/debug/ 2>/dev/null
mv manually_*.sql supabase/debug/ 2>/dev/null

# Move documentation to archive
echo "Moving old documentation..."
mv *_COMPLETE*.md docs/archive/ 2>/dev/null
mv *_SUMMARY*.md docs/archive/ 2>/dev/null
mv *_STATUS*.md docs/archive/ 2>/dev/null
mv *_PROGRESS*.md docs/archive/ 2>/dev/null
mv *_CHECKLIST*.md docs/archive/ 2>/dev/null
mv *_GUIDE*.md docs/archive/ 2>/dev/null
mv *_PLAN*.md docs/archive/ 2>/dev/null
mv *_FIXES*.md docs/archive/ 2>/dev/null
mv *_AUDIT*.md docs/archive/ 2>/dev/null
mv SESSION_*.md docs/archive/ 2>/dev/null
mv WEEK*.md docs/archive/ 2>/dev/null
mv PHASE*.md docs/archive/ 2>/dev/null

echo "✅ Organization complete!"
echo ""
echo "📁 Files moved to:"
echo "  - supabase/debug/ (debug & test SQL files)"
echo "  - supabase/fixes/ (fix & migration SQL files)"
echo "  - docs/archive/ (old documentation)"
echo ""
echo "⚠️  Review the moved files and delete any that are no longer needed."
