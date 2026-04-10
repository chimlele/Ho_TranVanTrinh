class FamilyTree {

    constructor(containerId, csvUrl) {
        this.containerId = containerId;
        this.csvUrl = csvUrl;
        this.init();
    }

    async init() {
        console.log("Loading CSV...");
        const res = await fetch(this.csvUrl);
        const text = await res.text();
        const data = d3.csvParse(text);

        console.log("CSV loaded", data);

        this.buildData(data);
        this.render();
    }

    buildData(data) {
        this.map = {};

        // tạo person
        data.forEach(d => {
            if (!d.ID) return;

            this.map[d.ID] = {
                id: d.ID,
                name: d["Họ Và Tên"] || "",
                gender: d["Giới tính"],
                birth: d["Năm sinh - Mất"] || "",
                photo: d.Photo || "",
                father: d.FID,
                mother: d.MID,
                spouses: d.PIDS ? d.PIDS.split(",") : [],
                children: []
            };
        });

        // build children
        Object.values(this.map).forEach(p => {
            if (p.father && this.map[p.father]) {
                this.map[p.father].children.push(p);
            }
            if (p.mother && this.map[p.mother]) {
                this.map[p.mother].children.push(p);
            }
        });

        // tìm root (người không có cha mẹ)
        this.root = Object.values(this.map).find(p => !p.father && !p.mother);

        console.log("Root:", this.root);
    }

    render() {
        const width = 3000;
        const height = 1500;

        const svg = d3.select(this.containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g").attr("transform", "translate(50,50)");

        const treeLayout = d3.tree().size([height - 100, width - 300]);

        const rootNode = d3.hierarchy(this.root);
        treeLayout(rootNode);

        // vẽ link
        g.selectAll(".link")
            .data(rootNode.links())
            .enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        // vẽ node
        const node = g.selectAll(".node")
            .data(rootNode.descendants())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("foreignObject")
            .attr("width", 150)
            .attr("height", 100)
            .html(d => `
                <div style="text-align:center;font-size:12px;width:140px">
                    <img src="${d.data.photo}" 
                         style="width:50px;height:50px;border-radius:50%"
                         onerror="this.style.display='none'"/>
                    <div><b>${d.data.name}</b></div>
                    <div>${d.data.birth}</div>
                </div>
            `);
    }
}
