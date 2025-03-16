import { markdownToOutput as marked } from "shahneshan";
import "./timetree-plugin.css";

function escapeHTML(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function convertToNumber(text) {
  const persianToEnglishMap = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return Number(text.replace(/[\u06F0-\u06F9]/g, char => persianToEnglishMap[char]));
}


const timetreePlugin = {
  name: "timetreePlugin",
  beforeParse: (text) => {
    return text.replace(/\.{3}نمودار\ درختی([\s\S]*?)\.{3}/g, (match, content) => {
      let maxWidth = '';
      const lines = content.trim().split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length > 0 && /^[0-9\u06F0-\u06F9]*$/.test(lines[0])) {
        const size = convertToNumber(lines[0]);
        if (size) {
          maxWidth = `max-width: ${size}px;`;
        }
      }

      const timetree = [];
      let currentSection = null;

      lines.forEach(line => {
        const sectionMatch = line.match(/^- (.+)$/);
        const entryMatch = line.match(/^(.+):(.+)$/);
        const continuationMatch = line.match(/^\s*:\s*(.+)$/);

        if (sectionMatch) {
          currentSection = { title: sectionMatch[1], entries: [] };
          timetree.push(currentSection);
        } else if (entryMatch) {
          const [_, period, item] = entryMatch;
          if (currentSection) {
            currentSection.entries.push({ period, items: [item] });
          } else {
            currentSection = { title: '', entries: [{ period, items: [item] }] };
            timetree.push(currentSection);
          }
        } else if (continuationMatch && continuationMatch[1] && currentSection?.entries.length > 0) {
          currentSection.entries[currentSection.entries.length - 1].items.push(continuationMatch[1]);
        }
      });

      let timetreeHTML = `<div class="timetree ${timetree[0]?.entries.length > 10 ? 'scale' : ''}">
        <div class="flip">
          <div class="timetree-container" style="${maxWidth}">`;

      timetree.forEach(section => {
        timetreeHTML += `
          <div class="section">
            ${section.title ? `<div class="section-title"><div class="title">${escapeHTML(section.title)}</div></div>` : `<div class="section-free"></div>`}
              <div class="entries">
                ${section.entries.map(entry => `
                  <div class="entry">
                    <div class="period">${escapeHTML(entry.period)}</div>
                    <div class="items">
                      ${entry.items.map(item => `<div class="item">${marked(item)}</div>`).join("")}
                    </div>
                  </div>
                `).join("")}
              </div>
          </div>
        `;
      });

      timetreeHTML += '<span class="arrow">➤</span></div></div></div>';
      return timetreeHTML;
    });
  },
  afterRender: () => {
    const timetrees = document.querySelectorAll('.timetree.scale');
    timetrees.forEach(timetree => {
      const flipElement = timetree.querySelector('.flip'); 
      const containerElement = timetree.querySelector('.timetree-container'); 
      if (containerElement && flipElement) {
        requestAnimationFrame(() => {
          const height = containerElement.offsetHeight;
          flipElement.style.height = height * 0.7 + 'px';
          console.log(`Set flipElement height to: ${height}px for timetree`);
        });
      }
    });  
  }
};

export default timetreePlugin;
