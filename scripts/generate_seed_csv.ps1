$ErrorActionPreference = 'Stop'

$outDir = 'data/seed_csv'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$skills = @(
  @{name='Python'; category='technical'; score=96},
  @{name='SQL'; category='technical'; score=93},
  @{name='Java'; category='technical'; score=88},
  @{name='C#'; category='technical'; score=82},
  @{name='Go'; category='technical'; score=85},
  @{name='JavaScript'; category='technical'; score=92},
  @{name='TypeScript'; category='technical'; score=91},
  @{name='React'; category='technical'; score=94},
  @{name='Angular'; category='technical'; score=79},
  @{name='Vue'; category='technical'; score=76},
  @{name='Node.js'; category='technical'; score=90},
  @{name='Spring Boot'; category='technical'; score=84},
  @{name='Django'; category='technical'; score=80},
  @{name='Flask'; category='technical'; score=78},
  @{name='FastAPI'; category='technical'; score=83},
  @{name='Machine Learning'; category='technical'; score=97},
  @{name='Deep Learning'; category='technical'; score=95},
  @{name='Data Analysis'; category='technical'; score=89},
  @{name='Tableau'; category='technical'; score=81},
  @{name='Power BI'; category='technical'; score=84},
  @{name='Excel'; category='technical'; score=74},
  @{name='AWS'; category='technical'; score=98},
  @{name='Azure'; category='technical'; score=90},
  @{name='GCP'; category='technical'; score=88},
  @{name='Docker'; category='technical'; score=92},
  @{name='Kubernetes'; category='technical'; score=91},
  @{name='Terraform'; category='technical'; score=86},
  @{name='Linux'; category='technical'; score=87},
  @{name='Git'; category='technical'; score=85},
  @{name='CI CD'; category='technical'; score=84},
  @{name='Cybersecurity'; category='technical'; score=89},
  @{name='Testing Automation'; category='technical'; score=83},
  @{name='Prompt Engineering'; category='technical'; score=90},
  @{name='System Design'; category='technical'; score=93},
  @{name='REST APIs'; category='technical'; score=91},
  @{name='GraphQL'; category='technical'; score=80},
  @{name='Communication'; category='soft'; score=85},
  @{name='Leadership'; category='soft'; score=87},
  @{name='Problem Solving'; category='soft'; score=90},
  @{name='Teamwork'; category='soft'; score=84},
  @{name='Negotiation'; category='soft'; score=76},
  @{name='Time Management'; category='soft'; score=79},
  @{name='Adaptability'; category='soft'; score=82},
  @{name='Stakeholder Management'; category='soft'; score=80},
  @{name='Agile Methodology'; category='domain'; score=88},
  @{name='Project Management'; category='domain'; score=89},
  @{name='Product Strategy'; category='domain'; score=81},
  @{name='UI UX Design'; category='domain'; score=83}
)

$skills | ForEach-Object {
  [pscustomobject]@{
    name = $_.name
    category = $_.category
    market_demand_score = $_.score
  }
} | Export-Csv -Path "$outDir/skills.csv" -NoTypeInformation

$firstNames = @('Aarav','Aisha','Akshay','Ananya','Arjun','Bhavya','Charan','Diya','Eshan','Farah','Gauri','Harish','Ishita','Jai','Kiran','Lakshya','Meera','Nikhil','Oviya','Pranav','Rhea','Saanvi','Tarun','Uma','Varun','Yash','Zara','Aditya','Bina','Chetan','Devika','Ekta','Faisal','Geeta','Hema','Inder','Jhanvi','Kabir','Lavanya','Manav','Neha','Omkar','Pooja','Qadir','Ritika','Siddharth','Tanvi','Uday','Vidya','Wasim','Xena','Yamini','Zubin')
$lastNames = @('Sharma','Iyer','Reddy','Patel','Singh','Nair','Kapoor','Mehta','Das','Verma','Rao','Menon','Bose','Joshi','Mishra','Khan','Gupta','Pillai','Chopra','Banerjee')
$departments = @('Engineering','Data','IT','HR','Design','Product','Finance','Security')
$jobTitles = @(
  'Software Engineer','Senior Software Engineer','Data Analyst','Data Scientist','BI Analyst','Backend Developer','Frontend Developer',
  'Full Stack Developer','Cloud Engineer','DevOps Engineer','QA Engineer','Security Analyst','HR Manager','Talent Manager',
  'Recruitment Specialist','UI UX Designer','Product Designer','Product Manager','Engineering Manager','Team Lead'
)

$employees = @()
for ($i = 1; $i -le 100; $i++) {
  $fn = $firstNames[$i % $firstNames.Count]
  $ln = $lastNames[$i % $lastNames.Count]
  $email = ("employee{0:D3}@company.com" -f $i)
  $role = if ($i -le 84) { 'employee' } elseif ($i -le 94) { 'team_lead' } elseif ($i -le 99) { 'hr_manager' } else { 'org_admin' }
  $dept = $departments[$i % $departments.Count]
  $title = $jobTitles[$i % $jobTitles.Count]
  $yoe = Get-Random -Minimum 1 -Maximum 16

  $employees += [pscustomobject]@{
    email = $email
    full_name = "$fn $ln"
    role = $role
    department = $dept
    job_title = $title
    years_of_experience = $yoe
  }
}
$employees | Export-Csv -Path "$outDir/employees.csv" -NoTypeInformation

$proficiency = @('beginner','intermediate','advanced','expert')
$empSkillsRows = @()
foreach ($e in $employees) {
  $count = Get-Random -Minimum 6 -Maximum 11
  $picked = $skills | Get-Random -Count $count
  foreach ($s in $picked) {
    $empSkillsRows += [pscustomobject]@{
      employee_email = $e.email
      skill_name = $s.name
      proficiency = $proficiency[(Get-Random -Minimum 0 -Maximum $proficiency.Count)]
      self_rated = if ((Get-Random -Minimum 0 -Maximum 100) -lt 72) { 'true' } else { 'false' }
    }
  }
}
$empSkillsRows | Sort-Object employee_email,skill_name -Unique | Export-Csv -Path "$outDir/employee_skills.csv" -NoTypeInformation

$availabilityRows = @()
foreach ($e in $employees) {
  $statusRoll = Get-Random -Minimum 0 -Maximum 100
  $status = if ($statusRoll -lt 50) { 'available' } elseif ($statusRoll -lt 80) { 'in_project' } elseif ($statusRoll -lt 92) { 'on_leave' } else { 'unavailable' }
  $days = Get-Random -Minimum 0 -Maximum 90
  $date = (Get-Date '2026-04-06').AddDays($days).ToString('yyyy-MM-dd')
  $note = if ($status -eq 'on_leave') { 'Planned leave' } elseif ($status -eq 'in_project') { 'Allocated to active project' } elseif ($status -eq 'unavailable') { 'Limited bandwidth this month' } else { 'Available for staffing' }

  $availabilityRows += [pscustomobject]@{
    employee_email = $e.email
    status = $status
    available_from = $date
    notes = $note
  }
}
$availabilityRows | Export-Csv -Path "$outDir/employee_availability.csv" -NoTypeInformation

$jobRequirements = @(
  @{title='Software Engineer'; department='Engineering'; min=2; req='Python,SQL,Problem Solving,REST APIs'; pref='AWS,React,Git'},
  @{title='Senior Software Engineer'; department='Engineering'; min=5; req='System Design,JavaScript,TypeScript,CI CD'; pref='AWS,Docker,Kubernetes'},
  @{title='Data Analyst'; department='Data'; min=2; req='SQL,Data Analysis,Excel,Tableau'; pref='Power BI,Python,Communication'},
  @{title='Data Scientist'; department='Data'; min=4; req='Python,Machine Learning,Deep Learning,SQL'; pref='AWS,Prompt Engineering,Tableau'},
  @{title='ML Engineer'; department='Data'; min=4; req='Python,Machine Learning,Docker,Kubernetes'; pref='GCP,FastAPI,System Design'},
  @{title='Backend Developer'; department='IT'; min=3; req='Java,Node.js,REST APIs,SQL'; pref='Docker,AWS,Testing Automation'},
  @{title='Frontend Developer'; department='IT'; min=3; req='React,TypeScript,JavaScript,UI UX Design'; pref='GraphQL,Testing Automation,Communication'},
  @{title='Full Stack Developer'; department='IT'; min=4; req='React,Node.js,SQL,Docker'; pref='AWS,TypeScript,CI CD'},
  @{title='Cloud Engineer'; department='Engineering'; min=4; req='AWS,Terraform,Docker,Kubernetes'; pref='Azure,GCP,Linux'},
  @{title='DevOps Engineer'; department='Engineering'; min=4; req='CI CD,Docker,Kubernetes,Linux'; pref='Terraform,AWS,Git'},
  @{title='QA Engineer'; department='Engineering'; min=3; req='Testing Automation,JavaScript,REST APIs,Problem Solving'; pref='CI CD,Communication,SQL'},
  @{title='Security Analyst'; department='Security'; min=3; req='Cybersecurity,Linux,Problem Solving,Communication'; pref='AWS,Python,Stakeholder Management'},
  @{title='Product Manager'; department='Product'; min=5; req='Product Strategy,Project Management,Stakeholder Management,Communication'; pref='Data Analysis,Agile Methodology,Leadership'},
  @{title='HR Manager'; department='HR'; min=5; req='Leadership,Communication,Negotiation,Project Management'; pref='Stakeholder Management,Time Management,Adaptability'},
  @{title='UI UX Designer'; department='Design'; min=2; req='UI UX Design,Communication,Problem Solving,Adaptability'; pref='Product Strategy,Stakeholder Management,Teamwork'}
)

$jobRows = foreach ($j in $jobRequirements) {
  [pscustomobject]@{
    title = $j.title
    department = $j.department
    min_experience_years = $j.min
    required_skills = $j.req
    preferred_skills = $j.pref
  }
}

$jobRows | Export-Csv -Path "$outDir/job_requirements.csv" -NoTypeInformation

Write-Host "Generated CSVs in $outDir"
