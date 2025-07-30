import pandas as pd
import re

# Define raw text input (full 8 subjects and chapters)
raw_data = """
1. geestelijke gezondheidszorg I
* W1 kwetsbaarheid
* W2 gedragsactivatie en vrijetijd
* W3 gedwongen opnamen
* H1 EHB geestelijke gezondheidszorg
* H2 Herstel en rehabilitatie
* H3 Arbeidsrehabilitatie
* W4 Casus anna + stigma
* Online M. Therapeutische relaties ED

2. Bewegingsanalyse I
* H1 Terminologie
* H2 Gewrichten
* H3 inleidende begrippen
* H4 botten
* H5 spierwerk shoulder
* H6 Biomechanica
* H7 Elleboog voorarm
* H8 De pols en de hand
* H9 Wercollege

3. Evidence based I
* GEEN LEERSTOF WEL HERWERKEN

4. Fysieke en geriatrische revalidatie I
* H1 inleiding
* H2 reumatische aandoeningen van de lumbale wervelkolom
* H3 G. Z. en revalidatie
* H4 locomotorische problemen en valpreventie
* H5 problemen heup en knie
* H6 schouderproblematiek
* H7 coma
* H8 dwarslesie
* H9 multescelerose
* H10 afloter
* H11 open en gesloten ketens

5. Ontwikkelingsdysfunctie II
* H1 schrijven en schriftmotoriek (let op groot hoofdstuk)
* H2 rekenen en rekenstoornissen
* andere assessment

6. geestelijke gezondheidszorg II
* H1 De rol van de ergotherapeut
* H2 De waarde van een activiteit
* H3 patiëntenrechten
* H4 executieve functies
* H5 herstel en rehabilitatie
* H6 ergotherapie in revalidatiecentrum
* W1 probleeminventarisatie en assesme
* W2 opstellen van een behandelplan
* W3 referentiekaders en behandelmethoden
* W4 ergotherapie methodiek en groepsdynam
* extra ergotherapeutische modellen

7. fysische en geriatrische revalidatie II
* H1 NAH
* H2 primaire neurocognitische stoornissen
* H3 afasie – apraxie – necelect
* H4 gnosie + amnesie + aandacht en exutieve functies
* H5 gebruik van de arm en hand in het dagelijks leven
* H6 bijkomende problemen
* P1 neuropsychologische functies
* P2 bobath
* P3 neurodevelopment
* P4 gebruik van de arm en hand in het dagelijks leven
* P5 panat
* P6 testen, spiegelen, mental practice
* H1 mobilisatietechnieken
* H2 klinische en neurologische testonderzoeken

8. Humana biologie C
* het ademhalingstelsel
* uitscheidingsstelsel
* incontinentie bij ouderen
* spijsvertering
* zenuwstelsel
* het endocrienstelsel
* de huid en de brandwonden
"""

# Initialize lists
subjects = []
chapters = []
current_subject = None

# Process each line
for line in raw_data.splitlines():
    line = line.strip()
    if not line:
        continue

    # Detect subject line (starts with number and dot)
    subject_match = re.match(r"^\d+\.\s+(.+)", line)
    if subject_match:
        current_subject = subject_match.group(1).strip()
        subjects.append(current_subject)
        continue

    # If it's a chapter (starts with *), remove H1/W1 and store it
    if line.startswith("*") and current_subject:
        chapter_text = re.sub(r"\*\s*(H\d+|W\d+|P\d+)?\s*", "", line).strip()
        if chapter_text and not chapter_text.lower().startswith("onderdeel") and "examen" not in chapter_text.lower():
            chapters.append({
                "subject": current_subject,
                "chapter": chapter_text
            })

# Convert to DataFrame
chapters_df = pd.DataFrame(chapters)

# Export
output_path = "D:/coding/NeuroNest/subject_chapters.csv"
chapters_df.to_csv(output_path, index=False, encoding="utf-8")
print(f"✅ Extracted {len(chapters)} chapters into:\n  {output_path}")
