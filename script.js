const timestamp = new Date().getTime();
fetch(`data.json?t=${timestamp}`)
  .then(response => response.json())
  .then(data => {
    console.log("Daten geladen:", data);
    document.getElementById("loader").style.display = "none";

    function renderTemplate(templateId, values) {
        let template = document.getElementById(templateId).innerHTML;
    
        // IF: {{#if key}}...{{else}}...{{/if}}
        template = template.replace(/{{#if (\w+)}}([\s\S]*?)({{else}}([\s\S]*?))?{{\/if}}/g, (match, key, ifContent, _, elseContent) => {
        const value = values[key];
        const showIf = Array.isArray(value) ? value.length > 0 : !!value;
        return showIf ? ifContent : (elseContent || '');
        });
    
        // UNLESS: {{#unless key}}...{{/unless}}
        template = template.replace(/{{#unless (\w+)}}([\s\S]*?){{\/unless}}/g, (match, key, content) => {
        const value = values[key];
        const showUnless = Array.isArray(value) ? value.length === 0 : !value;
        return showUnless ? content : '';
        });
    
        // Wiederholung {{#each key}}...{{/each}}
        template = template.replace(
        /{{#each (\w+)}}([\s\S]*?){{\/each}}/g,
        (match, key, content) => {
            const items = values[key];
            if (!Array.isArray(items)) return "";
    
            return items
            .map((item) => {
                let part = content;
                for (const k in item) {
                const val = k === "preis" ? formatPreis(item[k]) : item[k];
                part = part.replaceAll(`{{${k}}}`, val);
                }
                return part;
            })
            .join("");
        }
        );
    
        // Einfache Platzhalter {{key}}
        for (const key in values) {
        if (typeof values[key] !== "object") {
            const val = key === "preis" ? formatPreis(values[key]) : values[key];
            template = template.replaceAll(`{{${key}}}`, val);
        }
        }
    
        return template;
    }
    
    function formatPreis(value) {
        const number = parseFloat(value);
        if (isNaN(number)) return value;
        return number.toFixed(2).replace(".", ",");
    }
    
    const menuContainer = document.getElementById("menu");
    const contentContainer = document.getElementById("content");
    
    data.content.forEach((item) => {
        const isLogo = item.menutitel.toLowerCase() === "logo";
       
        const html = renderTemplate("template-menu-item", {
            ...item,
            isLogo: isLogo,
            link: isLogo ? "http://www.databyte.de" : "#"+item.menutitel.toLowerCase()
        });
    
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();
        const linkElement = wrapper.firstChild;
    
        menuContainer.appendChild(linkElement);
    
        if (Array.isArray(item.gerichte) && item.gerichte.length > 0) {
            const gerichteHTML = item.gerichte
                .map((gericht) => {
                return renderTemplate("template-gericht", {
                    ...gericht,
                    zusatzstoffe: gericht.zusatzstoffe.join(", "),
                });
                })
                .join("");
        
        
            const sectionHTML = renderTemplate("template-section", {
                link:  item.menutitel.toLowerCase(),
                image: item.image,
                titel: item.titel,
                gerichte: gerichteHTML,
            });
        
            contentContainer.insertAdjacentHTML("beforeend", sectionHTML);
        }
    });
      
    const sections = document.querySelectorAll(".section");
    const menuLinks = document.querySelectorAll(".menu a");
    
    const scrollContainer = document.querySelector(".container");
    let lastScrollTime = 0;
    let scrollEnabled = true;
    
    scrollContainer.addEventListener("scroll", () => {
        if (!scrollEnabled) return;
        const now = Date.now();
        if (now - lastScrollTime > 100) {
        lastScrollTime = now;
        setActiveByScroll();
        }
    });
    
    function setActiveByScroll() {
        const fromTop =
        scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
        let currentSectionId = null;
    
        sections.forEach((section) => {
        const offsetTop = section.offsetTop;
        if (fromTop >= offsetTop) {
            currentSectionId = section.id;
        }
        });
    
        if (currentSectionId) {
        menuLinks.forEach((link) => {
            const isActive =
            link.getAttribute("href").substring(1) === currentSectionId;
            link.classList.toggle("active", isActive);
            if (isActive) {
            link.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
            }
        });
        }
    }
      
    menuLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetId);

            // wenn der Link ein Logo ist, dann auf den hinterlegten Link gehen
            // ansonten scrollen
            if (targetSection !== null) {
                e.preventDefault();

                if (targetSection) {
                    scrollEnabled = false;
                    scrollContainer.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: "smooth",
                    });
            
                    setTimeout(() => {
                    scrollEnabled = true;
                    setActiveByScroll();
                    }, 800); // Wartezeit anpassen bei Bedarf
                }
            
                menuLinks.forEach((l) => l.classList.remove("active"));
                link.classList.add("active");
            
                link.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                });
            }
        });
            
    });
    
    window.addEventListener("load", () => {
        setActiveByScroll(); // beim Laden prüfen
    });
      
  })
  .catch(error => {
    console.error("Fehler beim Laden der Daten:", error);
  });