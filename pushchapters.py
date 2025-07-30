import pandas as pd
from supabase import create_client, Client

# Supabase configuration
url = "https://gbrldrmrqkvvtswqeqxf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdicmxkcm1ycWt2dnRzd3FlcXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTU0ODYsImV4cCI6MjA2Njg5MTQ4Nn0.CiDnQmJU_ymMET9p14BE5R3_2WdHCYmdQRso_7YRmWA"
supabase: Client = create_client(url, key)

# Load the CSV file
df = pd.read_csv("D:/coding/NeuroNest/subject_chapters.csv")

# User ID
user_id = "ba76c824-86b7-42b3-a9a3-e5f0fbb5a291"

def import_subjects_and_chapters():
    # Verify columns
    print("Columns in CSV:", df.columns.tolist())
    
    # Step 1: Process Subjects
    print("\n=== PROCESSING SUBJECTS ===")
    subject_id_map = {}
    
    # Get unique subjects (case-insensitive)
    df['subject_lower'] = df['subject'].str.lower()
    unique_subjects = df['subject'].unique()
    print(f"Found {len(unique_subjects)} unique subjects in CSV")
    
    # Check existing subjects (case-insensitive comparison)
    existing_subjects = supabase.table("subjects")\
        .select("subject_id, title")\
        .eq("user_id", user_id)\
        .execute()
    
    existing_subject_names = {subj['title'].lower(): subj['subject_id'] for subj in existing_subjects.data}
    print(f"Found {len(existing_subject_names)} existing subjects in database")
    
    # Insert new subjects
    new_subjects = []
    for subject in unique_subjects:
        if subject.lower() not in existing_subject_names:
            new_subjects.append(subject)
    
    if new_subjects:
        subjects_to_insert = [{"title": subj, "user_id": user_id} for subj in new_subjects]
        result = supabase.table("subjects").insert(subjects_to_insert).execute()
        print(f"Inserted {len(new_subjects)} new subjects")
        
        # Get updated subject mapping
        updated_subjects = supabase.table("subjects")\
            .select("subject_id, title")\
            .eq("user_id", user_id)\
            .execute()
        
        subject_id_map = {subj['title']: subj['subject_id'] for subj in updated_subjects.data}
    else:
        subject_id_map = {subj['title']: subj['subject_id'] for subj in existing_subjects.data}
        print("No new subjects to insert")
    
    print("Subject ID mapping:", subject_id_map)
    
    # Step 2: Process Chapters
    print("\n=== PROCESSING CHAPTERS ===")
    
    # Prepare chapters data
    chapters_data = []
    for _, row in df.iterrows():
        chapters_data.append({
            "subject": row['subject'],
            "chapter": row['chapter']
        })
    
    # Get existing chapters to avoid duplicates
    existing_chapters = supabase.table("chapters")\
        .select("title, subject_id")\
        .in_("subject_id", list(subject_id_map.values()))\
        .execute()
    
    existing_chapter_keys = {(chap['title'].lower(), chap['subject_id']) for chap in existing_chapters.data}
    
    # Prepare chapters for insertion
    chapters_to_insert = []
    for item in chapters_data:
        subject_id = subject_id_map[item['subject']]
        chapter_title = item['chapter']
        
        if (chapter_title.lower(), subject_id) not in existing_chapter_keys:
            chapters_to_insert.append({
                "title": chapter_title,
                "subject_id": subject_id,
                "order_idx": 0,  # Default value
                "effort_units": 1  # Default value
            })
    
    # Insert chapters in batches
    if chapters_to_insert:
        print(f"Preparing to insert {len(chapters_to_insert)} new chapters")
        
        batch_size = 100
        inserted_count = 0
        
        for i in range(0, len(chapters_to_insert), batch_size):
            batch = chapters_to_insert[i:i + batch_size]
            try:
                supabase.table("chapters").insert(batch).execute()
                inserted_count += len(batch)
                print(f"Inserted batch {i//batch_size + 1} ({len(batch)} chapters)")
            except Exception as e:
                print(f"Error inserting batch {i//batch_size + 1}: {str(e)}")
        
        print(f"Successfully inserted {inserted_count} new chapters")
    else:
        print("No new chapters to insert - all chapters already exist in database")
    
    print("\n=== IMPORT COMPLETE ===")
    print(f"Total subjects: {len(subject_id_map)}")
    print(f"Total chapters processed: {len(chapters_data)}")
    print(f"New chapters inserted: {len(chapters_to_insert)}")

if __name__ == "__main__":
    try:
        import_subjects_and_chapters()
    except Exception as e:
        print("Error:", str(e))
        print("\nPlease check your CSV file and database schema.")