"""
generate_lab11_docx.py
======================
Generates the formal academic Microsoft Word (.docx) document for:
Riphah International University - Faculty of Computing
SE2613 Human-Computer Interaction (HCI) - Fall 2026
Lab 11: Design Space Analysis & QOC Case Study (BorrowNest)
Student: Muhammad Taimoor Ajmal (SAP ID: 63461)
Class: BSCS 5-1
Instructor: Mr. Muhammad Shabbir Hassan

Outputs: docs/lab-reports/Lab11_63461_BSCS5-1.docx
Uses pure-Python OpenXML (ECMA-376 / ISO/IEC 29500) via standard zipfile library.
Requires no external pip dependencies.
"""

import os
import sys
import zipfile
import xml.sax.saxutils as saxutils

def escape(text):
    if text is None:
        return ""
    return saxutils.escape(str(text))

class DocxBuilder:
    def __init__(self):
        self.doc_body = []
        self.rels = []
        self.content_types = []
        self.media_files = {} # zip_path -> bytes
        
    def add_p(self, text="", style=None, align=None, space_before=0, space_after=120, bold=False, italic=False, color="1F2937", size=22):
        """Add a simple paragraph."""
        pPr = []
        if style:
            pPr.append(f'<w:pStyle w:val="{style}"/>')
        if align:
            pPr.append(f'<w:jc w:val="{align}"/>')
        if space_before or space_after:
            pPr.append(f'<w:spacing w:before="{space_before}" w:after="{space_after}" w:line="276" w:lineRule="auto"/>')
        
        pPr_xml = f'<w:pPr>{"".join(pPr)}</w:pPr>' if pPr else ''
        
        rPr = []
        if bold:
            rPr.append('<w:b/>')
        if italic:
            rPr.append('<w:i/>')
        if color:
            rPr.append(f'<w:color w:val="{color}"/>')
        if size:
            rPr.append(f'<w:sz w:val="{size}"/>')
            rPr.append(f'<w:szCs w:val="{size}"/>')
            
        rPr_xml = f'<w:rPr>{"".join(rPr)}</w:rPr>' if rPr else ''
        
        # Handle runs / newlines
        lines = text.split('\n')
        runs_xml = []
        for i, line in enumerate(lines):
            runs_xml.append(f'<w:r>{rPr_xml}<w:t xml:space="preserve">{escape(line)}</w:t></w:r>')
            if i < len(lines) - 1:
                runs_xml.append('<w:r><w:br/></w:r>')
                
        self.doc_body.append(f'<w:p>{pPr_xml}{"".join(runs_xml)}</w:p>')

    def add_rich_p(self, runs, style=None, align=None, space_before=0, space_after=120):
        """
        Add a paragraph with multiple distinct runs.
        runs: list of dicts: {'text': str, 'bold': bool, 'italic': bool, 'color': str, 'size': int, 'code': bool}
        """
        pPr = []
        if style:
            pPr.append(f'<w:pStyle w:val="{style}"/>')
        if align:
            pPr.append(f'<w:jc w:val="{align}"/>')
        if space_before or space_after:
            pPr.append(f'<w:spacing w:before="{space_before}" w:after="{space_after}" w:line="276" w:lineRule="auto"/>')
            
        pPr_xml = f'<w:pPr>{"".join(pPr)}</w:pPr>' if pPr else ''
        
        runs_xml = []
        for r in runs:
            text = r.get('text', '')
            bold = r.get('bold', False)
            italic = r.get('italic', False)
            color = r.get('color', '1F2937')
            size = r.get('size', 22) # 11pt default
            code = r.get('code', False)
            font = "Consolas" if code else "Calibri"
            
            rPr = [f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>']
            if bold:
                rPr.append('<w:b/>')
            if italic:
                rPr.append('<w:i/>')
            if color:
                rPr.append(f'<w:color w:val="{color}"/>')
            if size:
                rPr.append(f'<w:sz w:val="{size}"/>')
                rPr.append(f'<w:szCs w:val="{size}"/>')
            if code:
                rPr.append('<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>')
                
            rPr_xml = f'<w:rPr>{"".join(rPr)}</w:rPr>'
            
            lines = text.split('\n')
            for i, line in enumerate(lines):
                runs_xml.append(f'<w:r>{rPr_xml}<w:t xml:space="preserve">{escape(line)}</w:t></w:r>')
                if i < len(lines) - 1:
                    runs_xml.append('<w:r><w:br/></w:r>')
                    
        self.doc_body.append(f'<w:p>{pPr_xml}{"".join(runs_xml)}</w:p>')

    def add_heading_1(self, text):
        self.add_p(text, style="Heading1", color="1E3A8A", size=32, bold=True, space_before=360, space_after=140)

    def add_heading_2(self, text):
        self.add_p(text, style="Heading2", color="2563EB", size=26, bold=True, space_before=240, space_after=100)

    def add_heading_3(self, text):
        self.add_p(text, style="Heading3", color="1E293B", size=24, bold=True, space_before=180, space_after=80)

    def add_bullet(self, bold_prefix, text):
        runs = [
            {'text': "•  ", 'bold': True, 'color': "2563EB", 'size': 22},
            {'text': bold_prefix + ": " if bold_prefix else "", 'bold': True, 'color': "1E293B", 'size': 22},
            {'text': text, 'bold': False, 'color': "334155", 'size': 22}
        ]
        self.add_rich_p(runs, space_before=40, space_after=60)

    def add_callout(self, title, text, alert_type="NOTE"):
        border_color = "2563EB" if alert_type == "NOTE" else "DC2626" if alert_type in ("IMPORTANT", "WARNING") else "059669"
        bg_color = "F8FAFC"
        
        cell_xml = f'''<w:tc>
          <w:tcPr>
            <w:tcW w:w="9360" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/>
            <w:tcMar>
              <w:top w:w="160" w:type="dxa"/>
              <w:left w:w="240" w:type="dxa"/>
              <w:bottom w:w="160" w:type="dxa"/>
              <w:right w:w="240" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr>
            <w:r>
              <w:rPr><w:b/><w:color w:val="{border_color}"/><w:sz w:val="22"/></w:rPr>
              <w:t>[{escape(alert_type)}] {escape(title)}</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>
            <w:r>
              <w:rPr><w:color w:val="334155"/><w:sz w:val="21"/></w:rPr>
              <w:t xml:space="preserve">{escape(text)}</w:t>
            </w:r>
          </w:p>
        </w:tc>'''
        
        table_xml = f'''<w:tbl>
          <w:tblPr>
            <w:tblW w:w="9360" w:type="dxa"/>
            <w:tblBorders>
              <w:top w:val="none"/>
              <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
              <w:bottom w:val="none"/>
              <w:right w:val="none"/>
              <w:insideH w:val="none"/>
              <w:insideV w:val="none"/>
            </w:tblBorders>
          </w:tblPr>
          <w:tr>{cell_xml}</w:tr>
        </w:tbl>'''
        self.doc_body.append(table_xml)
        self.add_p("", space_before=0, space_after=120)

    def add_page_break(self):
        self.doc_body.append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')

    def add_image(self, img_path, caption, width_emus=5486400, height_emus=4320000):
        """Add an embedded image with caption."""
        if not os.path.exists(img_path):
            print(f"Warning: image {img_path} not found.")
            return
            
        with open(img_path, 'rb') as f:
            img_data = f.read()
            
        ext = 'jpg' if img_path.lower().endswith(('.jpg', '.jpeg')) else 'png'
        rel_id = f"rIdImg{len(self.media_files) + 1}"
        zip_img_path = f"word/media/image{len(self.media_files) + 1}.{ext}"
        self.media_files[zip_img_path] = img_data
        
        # Add to document relationships
        self.rels.append((rel_id, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", f"media/image{len(self.media_files)}.{ext}"))
        
        drawing_xml = f'''<w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="80"/></w:pPr>
          <w:r>
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                <wp:extent cx="{width_emus}" cy="{height_emus}"/>
                <wp:docPr id="{len(self.media_files)}" name="{escape(caption)}"/>
                <wp:cNvGraphicFramePr>
                  <a:graphicFrameLocks noChangeAspect="1" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
                </wp:cNvGraphicFramePr>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
                             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                      <pic:nvPicPr>
                        <pic:cNvPr id="0" name="image.{ext}"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="{rel_id}"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm>
                          <a:off x="0" y="0"/>
                          <a:ext cx="{width_emus}" cy="{height_emus}"/>
                        </a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="160"/></w:pPr>
          <w:r>
            <w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr>
            <w:t xml:space="preserve">{escape(caption)}</w:t>
          </w:r>
        </w:p>'''
        self.doc_body.append(drawing_xml)

    def add_table(self, headers, rows, col_widths=None):
        """
        Add a beautifully styled table.
        headers: list of str
        rows: list of list of str
        col_widths: list of int (in dxa, summing to ~9360)
        """
        num_cols = len(headers)
        if not col_widths:
            w = int(9360 / num_cols)
            col_widths = [w] * num_cols
            col_widths[-1] = 9360 - sum(col_widths[:-1])
            
        tblPr = '''<w:tblPr>
          <w:tblW w:w="9360" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:insideV w:val="none"/>
          </w:tblBorders>
          <w:tblCellMar>
            <w:top w:w="120" w:type="dxa"/>
            <w:left w:w="140" w:type="dxa"/>
            <w:bottom w:w="120" w:type="dxa"/>
            <w:right w:w="140" w:type="dxa"/>
          </w:tblCellMar>
        </w:tblPr>'''
        
        # Header row
        hdr_cells = []
        for i, h in enumerate(headers):
            hdr_cells.append(f'''<w:tc>
              <w:tcPr>
                <w:tcW w:w="{col_widths[i]}" w:type="dxa"/>
                <w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/>
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                <w:r>
                  <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
                  <w:t xml:space="preserve">{escape(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>''')
            
        tbl_rows = [f'<w:tr><w:trPr><w:tblHeader/></w:trPr>{"".join(hdr_cells)}</w:tr>']
        
        # Data rows
        for r_idx, row in enumerate(rows):
            row_cells = []
            bg = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
            for c_idx, val in enumerate(row):
                w = col_widths[c_idx] if c_idx < len(col_widths) else 1000
                bold_cell = (c_idx == 0 and len(row) > 2)
                row_cells.append(f'''<w:tc>
                  <w:tcPr>
                    <w:tcW w:w="{w}" w:type="dxa"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="{bg}"/>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
                    <w:r>
                      <w:rPr>{"<w:b/>" if bold_cell else ""}<w:color w:val="1E293B"/><w:sz w:val="20"/></w:rPr>
                      <w:t xml:space="preserve">{escape(str(val))}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>''')
            tbl_rows.append(f'<w:tr>{"".join(row_cells)}</w:tr>')
            
        self.doc_body.append(f'<w:tbl>{tblPr}{"".join(tbl_rows)}</w:tbl>')
        self.add_p("", space_before=0, space_after=140)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 1. document.xml
        body_content = "".join(self.doc_body)
        document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {body_content}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId3"/>
      <w:footerReference w:type="default" r:id="rId4"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''

        # 2. [Content_Types].xml
        img_types = []
        if any(p.endswith('.png') for p in self.media_files):
            img_types.append('<Default Extension="png" ContentType="image/png"/>')
        if any(p.endswith(('.jpg', '.jpeg')) for p in self.media_files):
            img_types.append('<Default Extension="jpg" ContentType="image/jpeg"/>')
            img_types.append('<Default Extension="jpeg" ContentType="image/jpeg"/>')
        content_types_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {"".join(img_types)}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>'''

        # 3. _rels/.rels
        root_rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

        # 4. word/_rels/document.xml.rels
        extra_rels = "".join([f'<Relationship Id="{r[0]}" Type="{r[1]}" Target="{r[2]}"/>' for r in self.rels])
        doc_rels_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  {extra_rels}
</Relationships>'''

        # 5. word/settings.xml
        settings_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
</w:settings>'''

        # 6. word/header1.xml
        header1_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="4" w:space="4" w:color="CBD5E1"/>
      </w:pBdr>
      <w:spacing w:after="100"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr>
      <w:t>Riphah International University • SE2613 Human-Computer Interaction • Lab 11 Case Study</w:t>
    </w:r>
  </w:p>
</w:hdr>'''

        # 7. word/footer1.xml
        footer1_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:top w:val="single" w:sz="4" w:space="4" w:color="CBD5E1"/>
      </w:pBdr>
      <w:spacing w:before="100"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr>
      <w:t>Muhammad Taimoor Ajmal (SAP 63461) | BorrowNest Design Rationale</w:t>
    </w:r>
    <w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:tab/><w:t>Page </w:t></w:r>
    <w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
    <w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t> of </w:t></w:r>
    <w:fldSimple w:instr="NUMPAGES"><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
  </w:p>
</w:ftr>'''

        # 8. word/styles.xml
        styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1F2937"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="360" w:after="140"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="1E3A8A"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="2563EB"/>
      <w:sz w:val="26"/>
      <w:szCs w:val="26"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="180" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="1E293B"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>'''

        with zipfile.ZipFile(filepath, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('[Content_Types].xml', content_types_xml)
            zf.writestr('_rels/.rels', root_rels_xml)
            zf.writestr('word/_rels/document.xml.rels', doc_rels_xml)
            zf.writestr('word/settings.xml', settings_xml)
            zf.writestr('word/styles.xml', styles_xml)
            zf.writestr('word/header1.xml', header1_xml)
            zf.writestr('word/footer1.xml', footer1_xml)
            zf.writestr('word/document.xml', document_xml)
            for zip_path, data in self.media_files.items():
                zf.writestr(zip_path, data)
                
        print(f"Successfully generated DOCX: {filepath} ({os.path.getsize(filepath):,} bytes)")

def build_lab11_document():
    doc = DocxBuilder()
    
    # ================= COVER PAGE =================
    doc.add_p("RIPHAH INTERNATIONAL UNIVERSITY", align="center", color="1E3A8A", size=36, bold=True, space_before=720, space_after=100)
    doc.add_p("Faculty of Computing — Department of Computer Science", align="center", color="475569", size=26, bold=True, space_before=0, space_after=60)
    doc.add_p("Course Code: SE2613 — Human-Computer Interaction (HCI) • Fall 2026", align="center", color="64748B", size=22, italic=True, space_before=0, space_after=400)
    
    doc.add_p("LABORATORY ASSIGNMENT 11", align="center", color="2563EB", size=28, bold=True, space_before=200, space_after=80)
    doc.add_p("Design Rationale & Design Space Analysis: The Questions, Options, and Criteria (QOC) Framework", align="center", color="1E3A8A", size=32, bold=True, space_before=0, space_after=140)
    doc.add_p("Case Study: BorrowNest — Peer-to-Peer Neighborhood Item Lending System", align="center", color="0D9488", size=24, bold=True, space_before=0, space_after=400)
    
    # Metadata Table
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Student Name", "Muhammad Taimoor Ajmal"],
        ["Student SAP ID", "63461"],
        ["Class & Section", "BSCS 5-1"],
        ["Course Instructor", "Mr. Muhammad Shabbir Hassan"],
        ["Institution", "Riphah International University, Islamabad / Lahore"],
        ["Academic Term", "Fall 2026"],
        ["Submission Date", "November 19, 2026"],
        ["Subject System", "BorrowNest (Share what you own. Borrow what you need.)"],
        ["Live Web Deployment", "https://muhammadtaimoorajmal.github.io/BorrowNest/"],
        ["GitHub Repository", "https://github.com/muhammadtaimoorajmal/BorrowNest"],
        ["Verification Evidence", "241 automated unit & integration tests passing across 30 test suites"]
    ]
    doc.add_table(meta_headers, meta_rows, [2800, 6560])
    doc.add_page_break()

    # ================= SECTION 1 =================
    doc.add_heading_1("1. Executive Summary & Academic Objectives")
    doc.add_heading_2("1.1 Purpose of Design Space Analysis")
    doc.add_p(
        "In modern Human-Computer Interaction (HCI) and software engineering, interface designs are frequently "
        "implemented ad hoc based on subjective developer intuition. When systems fail, the cause is rarely poor "
        "syntax; rather, it is the failure to systematically explore alternative designs, anticipate competing user "
        "needs, and document the rationale behind architectural trade-offs. The primary objective of HCI Lab 11 is to "
        "operationalize Design Space Analysis using the formal Questions, Options, and Criteria (QOC) framework "
        "(MacLean et al., 1991), establishing an auditable, historically defensible rationale for six critical decisions."
    )
    doc.add_heading_2("1.2 The Subject Application: BorrowNest")
    doc.add_p(
        "BorrowNest is a responsive, local-first web application engineered to facilitate peer-to-peer equipment and "
        "household resource sharing within residential neighborhoods. It directly targets the socio-economic paradox of "
        "underutilized physical assets: households purchase expensive tools (pressure washers, drills, carpet cleaners) "
        "that remain idle for >95% of their lives, while neighbors repeatedly incur financial costs to acquire identical items."
    )
    doc.add_p(
        "To make neighborhood lending practical, BorrowNest resolves four acute human challenges: dispute anxiety regarding "
        "unrecorded damage, personal physical address privacy, scheduling double bookings, and cognitive mode confusion. "
        "The application executes entirely client-side using React 19, Vite, and IndexedDB Schema Version 3, achieving "
        "absolute user privacy and zero reliance on central advertising servers."
    )
    doc.add_heading_2("1.3 Synthesis of Project Outcomes")
    doc.add_bullet("Six QOC Decisions", "DR-01 through DR-06 formally evaluated against 100% normalized weighted matrices.")
    doc.add_bullet("241 Automated Tests", "100% passing across 30 unit and integration test suites in Vitest.")
    doc.add_bullet("146 Design Tokens", "Verified across 33 CSS stylesheets ensuring 4.5:1 contrast and 44x44px touch targets.")
    doc.add_bullet("20 Curated Products", "Genuine photographs across 5 balanced categories with local attribution.")
    doc.add_bullet("Classroom Demo Marketplace", "5 simulated identities with live role switching, catalogue seeder, and reset.")
    doc.add_bullet("Zero Production Vulnerabilities", "Verified via npm audit --omit=dev with complete runtime security.")

    # ================= SECTION 2 =================
    doc.add_heading_1("2. Case Study Overview: The BorrowNest System")
    doc.add_heading_2("2.1 Domain Context & Socio-Technical Dilemmas")
    doc.add_p(
        "While community tool sharing offers undeniable environmental and financial benefits, peer lending introduces "
        "intense friction when managed casually via chat groups or bulletin boards. BorrowNest introduces dignified, "
        "accountable interaction protocols that eliminate awkward confrontations without the bureaucratic friction of "
        "commercial rental agencies."
    )
    doc.add_heading_2("2.2 User Personas")
    doc.add_bullet(
        "Persona 1: David Miller (The Prudent Tool Owner / Lender)",
        "48-year-old suburban homeowner. Owns well-maintained tools. Anxious about unrecorded scratches, missing drill bits, "
        "and strangers arriving unannounced. Requires strict scheduling control and complete home address protection."
    )
    doc.add_bullet(
        "Persona 2: Sarah Chen (The Urban DIYer / Resourceful Borrower)",
        "29-year-old apartment tenant. Limited household storage. Needs specialized tools for weekend DIY projects. "
        "Requires rapid search, transparent pickup proximity, clear return deadlines, and condition documentation so she "
        "is never blamed for pre-existing wear."
    )
    doc.add_heading_2("2.3 Local-First Prototype Architecture & Security Boundaries")
    doc.add_p(
        "BorrowNest is engineered as a local-first web application running entirely inside the client browser. "
        "While this delivers sub-millisecond responsiveness and offline resilience, it defines critical architectural boundaries: "
        "'Borrower' and 'Lender' represent functional task perspectives within the same browser session rather than authenticated "
        "cloud identities. Crucially, hiding data behind React conditionals provides zero cryptographic security; therefore, "
        "BorrowNest practices strict Data Minimization—sensitive residential street addresses are never collected."
    )

    # ================= SECTION 3 =================
    doc.add_heading_1("3. Methodological Framework: Questions, Options, and Criteria (QOC)")
    doc.add_p(
        "The QOC framework (MacLean et al., 1991) models design reasoning as a structured graph of Questions, Options, and "
        "Criteria. Each design dilemma is articulated as an open Question (Q), explored through mutually exclusive Options (O), "
        "and assessed against weighted Criteria (C) grounded in usability heuristics and accessibility standards."
    )
    doc.add_heading_2("3.1 Normalized Rating Formulation")
    doc.add_p(
        "Options are assessed on a standardized 5-point scale: 5 (Exemplary), 4 (Substantial), 3 (Moderate), "
        "2 (Deficient), and 1 (Unacceptable). Criteria weights Wi sum to 100%. The composite score is computed via:"
    )
    doc.add_p("Score = SUM [ Wi * (Ri / 5) ]   where SUM(Wi) = 100%, Ri in {1..5}, Score in [20.0 .. 100.0]", style="Normal", color="1E3A8A", bold=True, align="center")
    doc.add_heading_2("3.2 Academic Rigor & Honesty Statement")
    doc.add_callout(
        "Strict Academic Honesty & Methodological Boundary",
        "All ratings in this report are expert analytical evaluations conducted by the software engineer based on "
        "authoritative HCI literature (MacLean et al., Nielsen heuristics, WCAG 2.2). No empirical user testing with human "
        "subjects was performed. No participant quotes, surveys, or usability lab statistics are fabricated.",
        alert_type="IMPORTANT"
    )

    # ================= SECTION 4 =================
    doc.add_heading_1("4. Authoritative HCI Principles & Evaluation Standards")
    doc.add_p(
        "BorrowNest grounds its criteria in five authoritative foundational evidence sources (E-01 through E-05):"
    )
    doc.add_bullet("Source E-01: QOC Design Space Analysis", "MacLean et al. (1991). Structured representation of design trade-offs.")
    doc.add_bullet("Source E-02: Nielsen's 10 Usability Heuristics", "Jakob Nielsen (1994). Visibility of status, error prevention, recognition over recall, minimalism, and clear error recovery.")
    doc.add_bullet("Source E-03: W3C WCAG 2.2", "W3C Recommendation (2023). Clarifying SC 2.5.8 (24x24px Level AA minimum) vs SC 2.5.5 (44x44px Level AAA enhanced). BorrowNest intentionally enforces 44x44px targets.")
    doc.add_bullet("Source E-04: W3C Form Control Labeling", "W3C WAI (2023). Mandatory programmatic label associations.")
    doc.add_bullet("Source E-05: W3C Form Instructions & Validation", "W3C WAI (2023). Explicit upfront format instructions and aria-describedby associations.")

    # ================= SECTION 5 (DR-01) =================
    doc.add_heading_1("5. Formal Design Decision DR-01: Item Discovery & Exploration Architecture")
    doc.add_p("Question: How should users discover, browse, and search genuine available items without unnecessary cognitive effort?", bold=True, color="1E3A8A")
    doc.add_p(
        "Options Considered:\n"
        "• Option A: Category-First Hierarchical Browsing (Taxonomic folder tree).\n"
        "• Option B: Search-First Query Interface (Dominant single search input).\n"
        "• Option C: Unified Discovery (Concurrent search, category filter pills, availability toggle, active filter chips, zero-state recovery)."
    )
    dr1_headers = ["Criterion", "Weight", "Option A: Category", "Option B: Search", "Option C: Unified"]
    dr1_rows = [
        ["C1: Discoverability", "25%", "3 / 5", "3 / 5", "5 / 5"],
        ["C2: Cognitive Effort", "25%", "3 / 5", "2 / 5", "5 / 5"],
        ["C3: Feedback Clarity", "20%", "3 / 5", "3 / 5", "4 / 5"],
        ["C4: Accessibility & Mobile", "20%", "4 / 5", "4 / 5", "4 / 5"],
        ["C5: Local Simplicity", "10%", "4 / 5", "4 / 5", "4 / 5"],
        ["Weighted Total", "100%", "66.0 / 100", "61.0 / 100", "90.0 / 100 (Selected)"]
    ]
    doc.add_table(dr1_headers, dr1_rows)
    doc.add_p(
        "Decision Outcome: Option C is selected (Score: 90.0 / 100). Implemented in DiscoverPage.jsx and ItemFilterBar.jsx. "
        "Simultaneously accommodates targeted keyword searches and casual category browsing, externalizes memory cues "
        "via visible category pills (Nielsen Heuristic #6), and provides aria-live='polite' count announcements."
    )

    # ================= SECTION 6 (DR-02) =================
    doc.add_heading_1("6. Formal Design Decision DR-02: Structured Borrowing Requests & Approval Workflow")
    doc.add_p("Question: How should a borrower propose a borrowing arrangement and how should the item owner make a decision?", bold=True, color="1E3A8A")
    doc.add_p(
        "Options Considered:\n"
        "• Option A: Immediate Borrowing / Instant Checkout (1-click automatic reservation).\n"
        "• Option B: Unstructured Free-Text Messaging (Informal conversational chat).\n"
        "• Option C: Structured Borrowing Request with Finite State Machine (Explicit dates, borrower note, PENDING state, owner APPROVE/DECLINE)."
    )
    dr2_headers = ["Criterion", "Weight", "Option A: Immediate", "Option B: Messaging", "Option C: Structured"]
    dr2_rows = [
        ["C1: Owner Control", "25%", "1 / 5", "3 / 5", "5 / 5"],
        ["C2: Status Clarity", "25%", "3 / 5", "2 / 5", "5 / 5"],
        ["C3: Error Prevention", "20%", "2 / 5", "2 / 5", "4 / 5"],
        ["C4: Efficiency", "15%", "5 / 5", "2 / 5", "4 / 5"],
        ["C5: Local Feasibility", "15%", "3 / 5", "1 / 5", "4 / 5"],
        ["Weighted Total", "100%", "52.0 / 100", "42.0 / 100", "90.0 / 100 (Selected)"]
    ]
    doc.add_table(dr2_headers, dr2_rows)
    doc.add_p(
        "Decision Outcome: Option C is selected (Score: 90.0 / 100). Implemented in BorrowModal.jsx and BorrowingPage.jsx. "
        "Protects owner autonomy, eliminates conversational chaos, and enforces deterministic state transitions: "
        "PENDING -> APPROVED / DECLINED / CANCELLED."
    )

    # ================= SECTION 7 (DR-03) =================
    doc.add_heading_1("7. Formal Design Decision DR-03: Date-Range Scheduling & Conflict Prevention")
    doc.add_p("Question: How should availability and requested loan periods be represented so that users understand when an item can be borrowed and double-bookings are prevented?", bold=True, color="1E3A8A")
    dr3_headers = ["Criterion", "Weight", "Option A: Free-Text", "Option B: Date-Range", "Option C: Calendar Grid"]
    dr3_rows = [
        ["C1: Conflict Prevention", "30%", "1 / 5", "5 / 5", "4 / 5"],
        ["C2: Comprehension", "20%", "2 / 5", "4 / 5", "4 / 5"],
        ["C3: Flexibility", "15%", "4 / 5", "4 / 5", "4 / 5"],
        ["C4: Accessibility & Errors", "15%", "2 / 5", "4 / 5", "2 / 5"],
        ["C5: Implementation Simplicity", "20%", "5 / 5", "4 / 5", "1 / 5"],
        ["Weighted Total", "100%", "52.0 / 100", "86.0 / 100 (Selected)", "62.0 / 100"]
    ]
    doc.add_table(dr3_headers, dr3_rows)
    doc.add_p(
        "Decision Outcome: Option B is selected (Score: 86.0 / 100). Implemented in scheduling.js and IndexedDbStorageAdapter.js. "
        "Mathematically eliminates double bookings via the inclusive interval collision invariant: "
        "Collision <==> (candidateStart <= existingReturn) AND (candidateReturn >= existingStart). "
        "Utilizes accessible HTML5 date inputs rather than inaccessible third-party calendar grids."
    )

    # ================= SECTION 8 (DR-04) =================
    doc.add_heading_1("8. Formal Design Decision DR-04: Condition Checkpoints & Physical Handover Protocol")
    doc.add_p("Question: How should item condition be recorded before, during, and after borrowing to reduce misunderstandings without creating excessive interaction burden?", bold=True, color="1E3A8A")
    dr4_headers = ["Criterion", "Weight", "Option A: Free-Text", "Option B: Static Rating", "Option C: Checkpoints"]
    dr4_rows = [
        ["C1: Traceability", "25%", "2 / 5", "2 / 5", "5 / 5"],
        ["C2: Ease & Speed", "20%", "3 / 5", "5 / 5", "3 / 5"],
        ["C3: Evidence Quality", "15%", "2 / 5", "2 / 5", "5 / 5"],
        ["C4: Privacy & a11y", "20%", "4 / 5", "4 / 5", "4 / 5"],
        ["C5: Local Feasibility", "20%", "5 / 5", "5 / 5", "4 / 5"],
        ["Weighted Total", "100%", "64.0 / 100", "72.0 / 100", "84.0 / 100 (Selected)"]
    ]
    doc.add_table(dr4_headers, dr4_rows)
    doc.add_p(
        "Decision Outcome: Option C is selected (Score: 84.0 / 100). Implemented in HandoverInspectionModal.jsx and ReturnInspectionModal.jsx. "
        "Establishes standardized 5-tier grades (Like New, Good, Fair, Poor, Not Functional) captured at listing, collection, and return. "
        "Side-by-side comparative views provide objective evidence. Checkpoints are informational peer records stored in IndexedDB, "
        "not legally binding contracts or automated liability adjudications."
    )

    # ================= SECTION 9 (DR-05) =================
    doc.add_heading_1("9. Formal Design Decision DR-05: Coarse Area Spatial Privacy & Local Security Boundary")
    doc.add_p("Question: How should BorrowNest communicate collection proximity while minimizing exposure of sensitive residential information?", bold=True, color="1E3A8A")
    dr5_headers = ["Criterion", "Weight", "Option A: Exact Address", "Option B: Hide Until Approved", "Option C: Coarse Area"]
    dr5_rows = [
        ["C1: Data Minimization", "35%", "1 / 5", "4 / 5", "5 / 5"],
        ["C2: Pre-Request Context", "15%", "5 / 5", "1 / 5", "4 / 5"],
        ["C3: Honest Security", "25%", "1 / 5", "2 / 5", "5 / 5"],
        ["C4: User Control", "15%", "1 / 5", "3 / 5", "4 / 5"],
        ["C5: Interaction Friction", "10%", "5 / 5", "2 / 5", "4 / 5"],
        ["Weighted Total", "100%", "40.0 / 100", "54.0 / 100", "92.0 / 100 (Selected)"]
    ]
    doc.add_table(dr5_headers, dr5_rows)
    doc.add_p(
        "Decision Outcome: Option C is selected (Score: 92.0 / 100). Implemented in ItemFormModal.jsx and ItemCard.jsx. "
        "In a local-first client without a trusted server, conditional UI hiding is deceptive pseudo-security. Storing exact home "
        "addresses in client storage exposes them to browser dev tools. Option C enforces strict Data Minimization: exact residential "
        "street addresses are never collected. The client form uses heuristic validation as a behavioral nudge (Nielsen #5), "
        "while architectural privacy is absolute because sensitive addresses simply do not exist in the system."
    )

    # ================= SECTION 10 (DR-06) =================
    doc.add_heading_1("10. Formal Design Decision DR-06: Responsive Task-Oriented Navigation")
    doc.add_p("Question: How should the application organize borrowing and lending activities so that an individual can comfortably perform both types of tasks on desktop and mobile devices?", bold=True, color="1E3A8A")
    dr6_headers = ["Criterion", "Weight", "Option A: Separate Apps", "Option B: Mode Toggle", "Option C: Task Sections"]
    dr6_rows = [
        ["C1: Mental Model", "25%", "2 / 5", "3 / 5", "5 / 5"],
        ["C2: Efficiency", "20%", "1 / 5", "2 / 5", "5 / 5"],
        ["C3: Mobile Ergonomics", "20%", "3 / 5", "3 / 5", "4 / 5"],
        ["C4: Accessibility", "20%", "3 / 5", "3 / 5", "4 / 5"],
        ["C5: Simplicity", "15%", "2 / 5", "3 / 5", "4 / 5"],
        ["Weighted Total", "100%", "44.0 / 100", "56.0 / 100", "89.0 / 100 (Selected)"]
    ]
    doc.add_table(dr6_headers, dr6_rows)
    doc.add_p(
        "Decision Outcome: Option C is selected (Score: 89.0 / 100). Implemented in AppShell.jsx, AppHeader.jsx, and BottomNav.jsx. "
        "Eliminates mode disorientation by providing four fluid, task-oriented sections: Discover, Borrowing, Lending, and Account. "
        "Enforces 44x44 CSS px touch targets for mobile thumb ergonomics and semantic landmark navigation."
    )

    # ================= SECTION 11 =================
    doc.add_heading_1("11. Cross-Decision Architectural & HCI Synthesis")
    doc.add_p(
        "The six decisions interlock into a unified lifecycle: DR-01 (Discovery) displays items with coarse locality (DR-05). "
        "Requesting an item initiates DR-02 (Structured Request), with calendar bounds enforced by DR-03 (Overlap Collision Rule). "
        "Owner approval activates DR-04 (Condition Checkpoints), tracking pickup and return condition. The entire journey is navigated "
        "via DR-06 (Responsive Shell) without artificial role toggles."
    )
    doc.add_p(
        "At the persistence layer, IndexedDB Schema Version 3 maintains atomic integrity across three stores (items, borrowingRequests, "
        "loans) inside single readwrite transactions, completely preventing data inconsistency."
    )

    # ================= SECTION 12 =================
    doc.add_heading_1("12. Empirical Implementation Evidence & Quality Gate Verification")
    doc.add_bullet("Vitest Automated Test Harness", "241 tests passing across 30 test files in ~2.85s with 100% green status.")
    doc.add_bullet("Design Token Architecture", "146 tokens validated across 33 stylesheets with 0 hardcoded violations.")
    doc.add_bullet("Curated Demonstration Catalogue", "Exactly 20 products balanced across 5 categories with local authentic images.")
    doc.add_bullet("Classroom Marketplace Simulation", "Interactive 8-step lifecycle verified across 5 demonstration profiles with full data isolation and reset.")
    doc.add_bullet("Accessibility Verification", "All interactive targets meet or exceed 44x44px; color contrast >= 4.5:1.")
    doc.add_bullet("Production Build & CI", "Vite production build in ~280ms; GitHub Pages bundle; 0 production vulnerabilities.")

    # ================= SECTION 13 =================
    doc.add_heading_1("13. Honest System Limitations & Future Production Roadmap")
    doc.add_p(
        "To maintain academic honesty, BorrowNest documents its operational boundaries:\n"
        "1. Local Runtime Isolation: Executes within a single browser; no cross-device push notifications.\n"
        "2. Daily Granularity: Operates on whole calendar days without hourly reservation slots.\n"
        "3. Coarse Location: Final street meetups require verbal or external coordination.\n"
        "4. Absence of Field Trials: Evaluations are analytical; empirical human testing remains a future goal.\n"
        "Future Roadmap: Cloud synchronization via CRDTs, zero-knowledge address encryption, and Web Push PWA notifications."
    )

    # ================= SECTION 14 =================
    doc.add_heading_1("14. Conclusion & Key Academic Learnings")
    doc.add_p(
        "HCI Lab 11 demonstrates that disciplined Design Space Analysis transforms UI development from arbitrary guesswork into "
        "an auditable science. By explicitly mapping Questions, Options, and Criteria, BorrowNest achieved a balanced, accessible, "
        "and secure community lending platform. Engineering integrity requires architectural honesty: adopting coarse location "
        "and structured checkpoints resolves human friction while respecting client-side boundaries."
    )

    # ================= SECTION 15 =================
    doc.add_heading_1("15. Academic & Technical References")
    doc.add_p(
        "1. MacLean, A., Young, R. M., Bellotti, V. M. E., & Moran, T. P. (1991). Questions, Options, and Criteria: Elements of Design Space Analysis. Human-Computer Interaction, 6(3-4), 201-250. https://doi.org/10.1080/07370024.1991.9667168\n"
        "2. Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/\n"
        "3. World Wide Web Consortium (W3C) (2023). Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation. https://www.w3.org/TR/WCAG22/\n"
        "4. W3C Web Accessibility Initiative (WAI) (2023). Form Control Labeling. Web Accessibility Tutorials. https://www.w3.org/WAI/tutorials/forms/labels/\n"
        "5. W3C Web Accessibility Initiative (WAI) (2023). Form Instructions and Error Handling. Web Accessibility Tutorials. https://www.w3.org/WAI/tutorials/forms/instructions/\n"
        "6. Cavoukian, A. (2009). Privacy by Design: The 7 Foundational Principles. Information and Privacy Commissioner of Ontario.\n"
        "7. Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning. Cognitive Science, 12(2), 257-285. https://doi.org/10.1207/s15516709cog1202_4\n"
        "8. Norman, D. A. (2013). The Design of Everyday Things: Revised and Expanded Edition. Basic Books, New York."
    )

    # ================= SECTION 16 (APPENDICES) =================
    doc.add_heading_1("16. Appendices")
    doc.add_heading_2("Appendix A: Master QOC Summary Matrix")
    app_headers = ["ID", "Question", "Selected Option", "Score", "Core Usability Principle"]
    app_rows = [
        ["DR-01", "Item Discovery Architecture", "Option C: Unified Discovery", "90.0", "Nielsen #6 (Recognition over Recall)"],
        ["DR-02", "Borrowing Request Workflow", "Option C: Structured Request", "90.0", "Nielsen #1 (Visibility of Status)"],
        ["DR-03", "Date Scheduling & Conflict", "Option B: Date-Range Overlap", "86.0", "Nielsen #5 (Error Prevention)"],
        ["DR-04", "Condition Checkpoints", "Option C: Checkpoints (1-5)", "84.0", "Nielsen #2 (Match Real World)"],
        ["DR-05", "Location Spatial Privacy", "Option C: Coarse Area Only", "92.0", "Privacy by Design (Minimization)"],
        ["DR-06", "Responsive Task Navigation", "Option C: Task Sections", "89.0", "WCAG 2.5.5 (44px Touch Targets)"]
    ]
    doc.add_table(app_headers, app_rows)

    doc.add_heading_2("Appendix B: 20-Product Catalogue Breakdown")
    cat_headers = ["ID", "Title", "Category", "Tier", "Neighborhood"]
    cat_rows = [
        ["demo-001", "Cordless Drill Set", "Tools", "Good (4)", "Westside / Near Park"],
        ["demo-002", "High-Pressure Washer", "Tools", "Good (4)", "Oakridge North"],
        ["demo-003", "Orbit Sander", "Tools", "Like New (5)", "Elmwood District"],
        ["demo-004", "Extension Ladder", "Tools", "Fair (3)", "Hilltop Heights"],
        ["demo-005", "Angle Grinder", "Tools", "Good (4)", "River Valley"],
        ["demo-006", "Lawn Mower", "Gardening", "Good (4)", "Greenview Commons"],
        ["demo-007", "Hedge Trimmer", "Gardening", "Like New (5)", "Northwood Ridge"],
        ["demo-008", "Rake and Hoe Set", "Gardening", "Good (4)", "Cedar Creek"],
        ["demo-009", "Electric Leaf Blower", "Gardening", "Fair (3)", "Meadowlands"],
        ["demo-010", "Carpet Cleaner", "Household", "Like New (5)", "Downtown Central"],
        ["demo-011", "Wet/Dry Shop Vac", "Household", "Good (4)", "Sunset Hills"],
        ["demo-012", "Garment Steamer", "Household", "Good (4)", "Highland Park"],
        ["demo-013", "Sewing Machine", "Household", "Like New (5)", "Lakeside Village"],
        ["demo-014", "4-Person Tent", "Outdoor", "Good (4)", "Pinehurst Grove"],
        ["demo-015", "Kayak with Paddle", "Outdoor", "Fair (3)", "Marina Bay"],
        ["demo-016", "Camping Stove", "Outdoor", "Like New (5)", "Oakwood Heights"],
        ["demo-017", "Tailgate Table", "Outdoor", "Good (4)", "Brookside Manor"],
        ["demo-018", "Digital Multimeter", "Electronics", "Like New (5)", "University District"],
        ["demo-019", "PA Speaker & Mic", "Electronics", "Good (4)", "Midtown Terrace"],
        ["demo-020", "Energy Monitor", "Electronics", "Like New (5)", "Eastside Gardens"]
    ]
    doc.add_table(cat_headers, cat_rows)

    doc.add_p("Figure 1 illustrates the visual contact sheet of all 20 curated products:", italic=True, color="64748B")
    contact_sheet_jpg = os.path.join("docs", "assets", "DEMO_CATALOGUE_CONTACT_SHEET.jpg")
    doc.add_image(contact_sheet_jpg, "Figure 1: 20-Product Curated Demonstration Catalogue Contact Sheet (BorrowNest)")

    doc.add_heading_2("Appendix C: Verification Checklist")
    doc.add_bullet("Automated Tests", "241 tests passing across 30 files (Vitest 5.1.0).")
    doc.add_bullet("Design Tokens", "146 tokens validated across 33 CSS files with 0 violations.")
    doc.add_bullet("Lint & Formatting", "ESLint passing with 0 errors and 0 warnings.")
    doc.add_bullet("Production Build", "Vite production build clean; GitHub Pages deployment verified.")

    output_path = os.path.join("docs", "lab-reports", "Lab11_63461_BSCS5-1.docx")
    doc.save(output_path)

if __name__ == "__main__":
    build_lab11_document()
