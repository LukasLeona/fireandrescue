param(
  [Parameter(Mandatory = $true)]
  [string]$InspectorDirectory,

  [Parameter(Mandatory = $true)]
  [string]$InstructorDirectory,

  [string]$DataDirectory = (Join-Path $PSScriptRoot '..\lib\course-content'),
  [string]$MediaDirectory = (Join-Path $PSScriptRoot '..\public\assets\images\course-source')
)

$ErrorActionPreference = 'Stop'

function Get-ChapterNumber([System.IO.FileInfo]$Deck) {
  $match = [regex]::Match($Deck.BaseName, '(?i)(?:chapter|ch)\s*0*(\d+)')
  if (-not $match.Success) { return 999 }
  return [int]$match.Groups[1].Value
}

function Normalize-SourceText([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
  return ($Value -replace "`v", "`n" -replace "`r`n", "`n" -replace "`r", "`n").Trim()
}

function Get-ShapeText($Shape) {
  $results = [System.Collections.Generic.List[string]]::new()

  try {
    if ($Shape.Type -eq 6) {
      for ($groupIndex = 1; $groupIndex -le $Shape.GroupItems.Count; $groupIndex += 1) {
        foreach ($value in (Get-ShapeText $Shape.GroupItems.Item($groupIndex))) { $results.Add($value) }
      }
      return $results
    }
  } catch {}

  try {
    if ($Shape.HasTable -eq -1) {
      for ($row = 1; $row -le $Shape.Table.Rows.Count; $row += 1) {
        for ($column = 1; $column -le $Shape.Table.Columns.Count; $column += 1) {
          $cellText = Normalize-SourceText $Shape.Table.Cell($row, $column).Shape.TextFrame.TextRange.Text
          if ($cellText) { $results.Add($cellText) }
        }
      }
      return $results
    }
  } catch {}

  try {
    if ($Shape.HasTextFrame -eq -1 -and $Shape.TextFrame.HasText -eq -1) {
      $shapeText = Normalize-SourceText $Shape.TextFrame.TextRange.Text
      if ($shapeText) { $results.Add($shapeText) }
    }
  } catch {}

  return $results
}

function Get-SlideTitle($Slide, [string[]]$TextBlocks) {
  try {
    if ($Slide.Shapes.HasTitle -eq -1) {
      $title = Normalize-SourceText $Slide.Shapes.Title.TextFrame.TextRange.Text
      if ($title) { return $title }
    }
  } catch {}
  if ($TextBlocks.Count -gt 0) { return ($TextBlocks[0] -split "`n")[0] }
  return "Slide $($Slide.SlideIndex)"
}

function Get-Notes($Slide) {
  $notes = [System.Collections.Generic.List[string]]::new()
  try {
    foreach ($shape in $Slide.NotesPage.Shapes) {
      try {
        if ($shape.Type -eq 14 -and $shape.PlaceholderFormat.Type -ne 2) { continue }
      } catch {}
      foreach ($value in (Get-ShapeText $shape)) {
        if ($value -and -not $notes.Contains($value)) { $notes.Add($value) }
      }
    }
  } catch {}
  return $notes
}

function Get-VisualSlideNumbers([int]$SlideCount) {
  $numbers = @(
    1,
    [Math]::Max(1, [Math]::Round($SlideCount * 0.25)),
    [Math]::Max(1, [Math]::Round($SlideCount * 0.5)),
    [Math]::Max(1, [Math]::Round($SlideCount * 0.75)),
    $SlideCount
  )
  return @($numbers | Sort-Object -Unique)
}

function Export-CourseSource(
  $PowerPoint,
  [string]$CourseSlug,
  [string]$CourseTitle,
  [string]$Standard,
  [string]$SourceDirectory
) {
  $decks = @(Get-ChildItem -LiteralPath $SourceDirectory -File | Where-Object { $_.Extension -match '^\.pptx?$' } | Sort-Object @{ Expression = { Get-ChapterNumber $_ } }, Name)
  if ($decks.Count -eq 0) { throw "No PowerPoint decks found in $SourceDirectory" }

  $courseMediaDirectory = Join-Path $MediaDirectory $CourseSlug
  [System.IO.Directory]::CreateDirectory($courseMediaDirectory) | Out-Null
  $modules = [System.Collections.Generic.List[object]]::new()

  foreach ($deck in $decks) {
    $chapterNumber = Get-ChapterNumber $deck
    $moduleId = "chapter-$('{0:D2}' -f $chapterNumber)"
    $moduleMediaDirectory = Join-Path $courseMediaDirectory $moduleId
    [System.IO.Directory]::CreateDirectory($moduleMediaDirectory) | Out-Null
    Write-Host "Extracting $($deck.Name)"

    $presentation = $PowerPoint.Presentations.Open($deck.FullName, $true, $false, $false)
    try {
      $slides = [System.Collections.Generic.List[object]]::new()
      $visuals = [System.Collections.Generic.List[object]]::new()
      $visualSlideNumbers = Get-VisualSlideNumbers $presentation.Slides.Count
      $aspectHeight = [int][Math]::Round(1280 * ($presentation.PageSetup.SlideHeight / $presentation.PageSetup.SlideWidth))

      foreach ($slide in $presentation.Slides) {
        $textBlocks = [System.Collections.Generic.List[string]]::new()
        foreach ($shape in @($slide.Shapes | Sort-Object Top, Left)) {
          foreach ($value in (Get-ShapeText $shape)) {
            if ($value -and -not $textBlocks.Contains($value)) { $textBlocks.Add($value) }
          }
        }

        $notes = Get-Notes $slide
        $slides.Add([ordered]@{
          number = [int]$slide.SlideIndex
          title = Get-SlideTitle $slide $textBlocks.ToArray()
          content = @($textBlocks)
          notes = @($notes)
        })

        if ($visualSlideNumbers -contains $slide.SlideIndex) {
          $fileName = "slide-$('{0:D3}' -f $slide.SlideIndex).jpg"
          $filePath = Join-Path $moduleMediaDirectory $fileName
          $slide.Export($filePath, 'JPG', 1280, $aspectHeight)
          $visuals.Add([ordered]@{
            slide = [int]$slide.SlideIndex
            src = "/assets/images/course-source/$CourseSlug/$moduleId/$fileName"
            alt = "Source slide $($slide.SlideIndex) from $($deck.BaseName)"
          })
        }
      }

      $firstTitle = ($slides | Where-Object { $_.title -and $_.title -notmatch '^Slide \d+$' } | Select-Object -First 1).title
      $moduleTitle = if ($firstTitle) { $firstTitle -replace "`n", ' ' } else { $deck.BaseName }
      $modules.Add([ordered]@{
        id = $moduleId
        chapter = $chapterNumber
        title = $moduleTitle
        sourceFile = $deck.Name
        slideCount = [int]$presentation.Slides.Count
        visuals = @($visuals)
        slides = @($slides)
      })
    } finally {
      $presentation.Close()
      [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
    }
  }

  $totalSlides = 0
  foreach ($module in $modules) { $totalSlides += [int]$module['slideCount'] }

  $course = [ordered]@{
    slug = $CourseSlug
    title = $CourseTitle
    standard = $Standard
    sourceNotice = 'Lesson wording is reproduced from the supplied PowerPoint modules. Activities and assessments are supplemental learning aids.'
    moduleCount = $modules.Count
    slideCount = $totalSlides
    modules = @($modules)
  }

  [System.IO.Directory]::CreateDirectory($DataDirectory) | Out-Null
  $outputPath = Join-Path $DataDirectory "$CourseSlug.json"
  $json = $course | ConvertTo-Json -Depth 20 -Compress
  [System.IO.File]::WriteAllText($outputPath, $json, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Wrote $outputPath ($($course.slideCount) slides)"
}

$powerPoint = New-Object -ComObject PowerPoint.Application
try {
  Export-CourseSource $powerPoint 'fire-inspector-1' 'Fire Inspector 1' 'NFPA 1031-aligned supplied modules' $InspectorDirectory
  Export-CourseSource $powerPoint 'fire-instructor-1' 'Fire Instructor 1' 'NFPA 1041 supplied modules' $InstructorDirectory
} finally {
  $powerPoint.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
