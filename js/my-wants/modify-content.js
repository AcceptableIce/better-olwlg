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
		matches: window.modifyDiv.hasClass("autocheckinfo"),
		remove: true
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

export default function modifyContent() {
	const content = document.querySelector(".header").nextElementSibling;

	content.classList.add("content");

	window.modifyDiv(content, mainModifications);

	const helpText = document.querySelector("#gamedesc");

	helpText.classList.add("alert", "info", "help-text");
	helpText.removeAttribute("id");

	window.modifyDiv(document.querySelector("#dummy"), duplicateProtectionModifications);

	document.querySelectorAll(".ondummy2").forEach(warning => warning.classList.add("alert", "error"));
}