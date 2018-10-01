// TABLE PARSE
const tableData = {
	wants: [],
	listings: []
};

const table = document.querySelector("#wants");

const matchId = (element, prefix, dummyClass) => {
	const idAttribute = element.getAttribute("id");
	const matchData = idAttribute.match(new RegExp(`${prefix}([0-9]+)`));

	if(matchData && matchData[1]) {
		return matchData[1];
	} else if(!dummyClass || element.classList.contains(dummyClass)) {
		const dummyMatchData = idAttribute.match(new RegExp(`${prefix}([a-zA-Z0-9]+)`));

		return dummyMatchData && dummyMatchData[1];
	}

	return undefined;
};

const getBGGIdFromLink = link => {
	const matches = link.match(/boardgamegeek\.com\/[\S]*?\/([0-9]+)/);

	return matches && matches[1];
};

[].slice.apply(table.querySelectorAll("thead tr th")).slice(2).forEach((header, index) => {
	const id = matchId(header, "gm", "isdummy");

	if(id) {
		tableData.listings.push({
			id,
			name: header.getAttribute("title"),
			wants: []
		});
	} else {
		throw new Error(`No ID found in column ${index}! Is something misformatted?`);
	}
});

const rows = [].slice.apply(table.querySelectorAll("tbody tr"));
let dummyRowsProcessed = 0;

rows.slice(1, rows.length - 2).forEach((row, index) => {
	const id = matchId(row, "gn");

	if(id) {
		const nameCell = row.querySelector("td:nth-of-type(2)");
		const nameLink = nameCell.querySelector("a[href*='boardgamegeek.com/thing/']");
		const name = nameLink.textContent;
		const bgg_id = getBGGIdFromLink(nameLink.getAttribute("href"));
		const owner = nameCell.querySelector(".owner").textContent;

		if(id.match(/([0-9]+)/)) {
			const want = {
				id,
				name,
				bgg_id,
				owner,
				sweeteners: [] // TODO: enumerate sweeteners
			};

			row.querySelectorAll("font").forEach(sweetener => {
				const bggLink = sweetener.querySelector("a");

				want.sweeteners.push({
					id: null,
					name: bggLink.textContent,
					bgg_id: getBGGIdFromLink(bggLink.getAttribute("href")),
					owner,
					sweeteners: null
				});
			});

			tableData.wants.push(want);
		} else {
			const matchingDummy = tableData.listings.filter(listing => listing.id === id);

			if(matchingDummy) {
				matchingDummy.rowIndex = index;

				dummyRowsProcessed += 1;
			} else {
				throw new Error(`Row has a dummy ID but does not match any dummy listings! (ID: ${id})`);
			}

		}

		[].slice.apply(row.querySelectorAll("td")).slice(2).forEach((cell, cellIndex) => {
			const listing = tableData.listings[cellIndex];
			const want = tableData.wants[index - dummyRowsProcessed];

			if(!want) {
				// This is a dummy row.
				want = tableData.listings.filter(item => item.rowIndex === cellIndex)[0];
			}

			if(listing) {
				if(want) {
					if(cell.querySelector("input")) {
						listing.wants.push(want);
					}
				} else {
					throw new Error(`There is no matching want for row ${index}.`);
				}
			} else {
				throw new Error(`There is no matching listing for column ${cellIndex}.`);
			}
		});
	} else {
		throw new Error(`No ID found in column ${index}! Is something misformatted?`);
	}
});

console.log("Table data: ", tableData);

// RESTYLE CONTENT
document.querySelector(".autocheckinfo").classList.add("alert", "info");

document.querySelectorAll("#wants th").forEach(header => {
	const innerDiv = document.createElement("div");
	const innerSpan = document.createElement("span");

	const columns = [];

	(header.querySelector("tt") || header).childNodes.forEach(child => {
		if(child.tagName !== "BR") {
			for(let index = 0; index < child.textContent.length; index += 1) {
				let subindex = index / 2;

				if(index % 2 === 0) {
					if(!columns[subindex]) columns[subindex] = [];
					columns[subindex].push(child.textContent[index] || " ");
				}
			}
		}
	});

	innerSpan.textContent = columns.map(column => column.join("").trim() + " ").join("").trim();

	innerDiv.appendChild(innerSpan);

	header.innerHTML = "";
	header.appendChild(innerDiv);

	header.classList.remove("vertical");
});

document.querySelectorAll("#wants tbody tr").forEach(row => {
	const secondCell = row.querySelector("td:nth-of-type(2)");

	if(secondCell) {
		const container = document.createElement("div");

		container.classList.add("item-info-container");

		[].slice.apply(secondCell.childNodes).forEach(child => container.appendChild(child));

		secondCell.appendChild(container);

		if(secondCell.classList.contains("isdummyrow")) {
			row.querySelector("td:nth-of-type(1)").classList.add("isdummyrow");
		}
	}
});

const mainModifications = [
	{
		matches: window.modifyDiv.requireText("left to submit", "p"),
		className: ["alert", "info", "clock", "single-line", "large", "time-remaining"]
	},
	{
		matches: window.modifyDiv.requireText("Warning!", "h3"),
		combineRest: "div",
		combineUntil: (element, count) => element.tagName === "TABLE" || count === 3,
		className: ["alert", "warning"],
		childRules: [
			{
				matches: window.modifyDiv.requireText("You can click on each of the following", "text"),
				wrap: true,
				transformHTML: content => content.replace(":", "").replace("Warning!", "").trim() + "."
			}
		]
	},
	{
		matches: window.modifyDiv.hasClass("itemschanged"),
		className: ["alert", "warning"],
		transformHTML: content => {
			const [itemMatch, itemsChanged] = content.match(/([0-9]*) item/);
			const [clickMatch, clickHereLink] = content.match(/<a href="([\S]*)">click here<\/a>/);

			return `${itemsChanged} ${itemsChanged === 1 ? "item has" : "items have"} been edited by their owners after you added ` +
				`them to your wantlist. Please examine the items marked with <img src="images/changed.png" height="24"> and ` +
				`<a href="${clickHereLink}"> click here.</a>`;
		}
	},
	{
		matches: window.modifyDiv.hasClass("notsubmitted"),
		className: ["alert", "warning", "single-line"]
	}
];

const content = document.querySelector(".header").nextElementSibling;

content.classList.add("content");

window.modifyDiv(content, mainModifications);

const helpText = document.querySelector("#gamedesc");

helpText.classList.add("alert", "info", "help-text");
helpText.removeAttribute("id");

const duplicateProtectionModifications = [
	{
		matches: window.modifyDiv.requireText("Create a New Dummy Item", "h2"),
		combineRest: "div",
		combineUntil: element => element.tagName === "H2",
		className: ["alert", "new-dummy-item-panel"]
	},
	{
		matches: window.modifyDiv.requireText("How to Use", "h2"),
		combineRest: "div",
		className: ["alert", "info", "how-to-use-duplicate-protection"]
	}
];

window.modifyDiv(document.querySelector("#dummy"), duplicateProtectionModifications);

document.querySelectorAll(".ondummy2").forEach(warning => warning.classList.add("alert", "error"));

const header = document.querySelector("tr.head");
const scrollingHeader = document.createElement("div");

header.querySelectorAll("th").forEach(column => {
	const scrollingColumn = document.createElement("div");

	scrollingColumn.classList.add("scrolling-column");
	scrollingColumn.innerHTML = column.innerHTML;
	scrollingColumn.style.width = column.offsetWidth + "px";

	scrollingHeader.appendChild(scrollingColumn);
});

scrollingHeader.classList.add("scrolling-header");

document.querySelector("#table").appendChild(scrollingHeader);

const wantsTable = document.querySelector("#wants");
const tableHeader = document.querySelector("#wants thead tr");

window.addEventListener("scroll", evt => {
	const hideScrollingHeader = wantsTable.getBoundingClientRect().top > 54;

	scrollingHeader.style.display = hideScrollingHeader ? "none" : "block";
	tableHeader.style.visibility = hideScrollingHeader ? "visible" : "hidden";

	scrollingHeader.style.left = -window.pageXOffset + "px";
});
