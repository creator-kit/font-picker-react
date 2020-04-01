import {
	Category,
	Font,
	FONT_FAMILY_DEFAULT,
	FontManager,
	Options,
	OPTIONS_DEFAULTS,
	Script,
	SortOption,
	Variant,
} from "@creator-kit/font-manager";
import { Button, Spinner, TextField, TextStyle } from "@shopify/polaris";
import React, { useState, useEffect } from "react";
import styled from "styled-components";

type LoadingStatus = "loading" | "finished" | "error";

interface Props {
	// Required props
	apiKey: string;
	activeFontFamily: string;
	onChange: (font: Font) => void;

	// Optional props
	pickerId: string;
	families: string[];
	categories: Category[];
	scripts: Script[];
	variants: Variant[];
	filter: (font: Font) => boolean;
	limit: number;
	sort: SortOption;
}

// interface State {
// 	expanded: boolean;
// 	loadingStatus: LoadingStatus;
// }

/**
 * Return the fontId based on the provided font family
 */
function getFontId(fontFamily: string): string {
	return fontFamily.replace(/\s+/g, "-").toLowerCase();
}

const FontPicker = ({
	apiKey,
	activeFontFamily,
	pickerId,
	families,
	categories,
	scripts,
	variants,
	filter,
	limit,
	sort,
	onChange,
}: Props) => {
	const [expanded, setExpanded] = useState(false);
	const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("loading");
	const [fontManager, setFontManager] = useState<FontManager | null>(null);
	const [searchTerm, setSearchTerm] = useState<string | undefined>();
	const debouncedSearchTerm = useDebounce(searchTerm, 500);
	const [fonts, setFontList] = useState<Font[]>([]);

	useEffect(() => {
		const options: Options = {
			pickerId,
			families,
			categories,
			scripts,
			variants,
			filter,
			limit,
			sort,
		};
		const newFontManager = new FontManager(apiKey, activeFontFamily, options, onChange);
		newFontManager
			.init()
			.then((): void => {
				setLoadingStatus("finished");
				setFontManager(newFontManager);
			})
			.catch((err: Error): void => {
				// On error: Log error message
				setLoadingStatus("error");
				console.error("Error trying to fetch the list of available fonts");
				console.error(err);
			});
	}, []);

	useEffect(() => {
		if (fontManager && activeFontFamily) {
			fontManager.setActiveFont(activeFontFamily);
		}
	}, [activeFontFamily]);

	useEffect(() => {
		if (fontManager) {
			fontManager.setOnChange(onChange);
		}
	}, [onChange]);

	useEffect(() => {
		if (!fontManager) {
			return;
		}
		if (debouncedSearchTerm) {
			fontManager
				.searchFont(debouncedSearchTerm)
				.then(result => result && setFontList(Array.from(result.values())));
		} else {
			setFontList(Array.from(fontManager.getFonts().values()));
		}
	}, [fontManager, debouncedSearchTerm]);

	const onChangeFont = (fontId: string) => {
		if (fontManager) {
			fontManager.setActiveFont(fontId);
			setExpanded(false);
		}
	};

	return (
		<Container>
			<Button onClick={() => setExpanded(e => !e)} disclosure fullWidth>
				{activeFontFamily}
			</Button>
			<Popover active={expanded}>
				{loadingStatus === "finished" ? (
					<PopupContent>
						<SearchContainer>
							<TextField
								label="Search Google fonts"
								labelHidden
								placeholder="Search Google fonts"
								onChange={value => {
									setSearchTerm(value);
								}}
								clearButton
								onClearButtonClick={() => setSearchTerm(undefined)}
								value={searchTerm}
							></TextField>
						</SearchContainer>
						<FontList>
							{fonts.length === 0 ? (
								<CenteredContent>
									<TextStyle variation="subdued">No supplier listed</TextStyle>
								</CenteredContent>
							) : null}
							{fonts.map(font => {
								const fontId = getFontId(font.family);
								return (
									<FontRow
										key={fontId}
										id={`font-button-${fontId}${fontManager?.selectorSuffix}`}
										active={font.family === activeFontFamily}
										onClick={() => onChangeFont(font.family)}
									>
										{font.family}
									</FontRow>
								);
							})}
						</FontList>
					</PopupContent>
				) : (
					<CenteredContent>
						<Spinner />
					</CenteredContent>
				)}
			</Popover>
		</Container>
	);
};

const useDebounce = (value: any, delay: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);
	return debouncedValue;
};

FontPicker.defaultProps = {
	defaultFamily: FONT_FAMILY_DEFAULT,
	pickerId: OPTIONS_DEFAULTS.pickerId,
	families: OPTIONS_DEFAULTS.families,
	categories: OPTIONS_DEFAULTS.categories,
	scripts: OPTIONS_DEFAULTS.scripts,
	variants: OPTIONS_DEFAULTS.variants,
	filter: OPTIONS_DEFAULTS.filter,
	limit: OPTIONS_DEFAULTS.limit,
	sort: OPTIONS_DEFAULTS.sort,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onChange: (): void => {},
};

const CenteredContent = styled.div`
	padding: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const PopupContent = styled.div`
	display: flex;
	flex: 1;
	flex-direction: column;
	height: 250px;
	width: 300px;
`;

const SearchContainer = styled.div`
	padding: 10px;
	border-bottom: 1px solid #ddd;
`;

const FontList = styled.div`
	flex: 1;
	overflow: auto;
`;

const FontRow = styled.div<{ active: boolean }>`
	padding: 10px;
	padding-left: 12px;
	border-bottom: 1px solid #eee;
	transition: all 100ms ease-out;
	cursor: pointer;
	background: ${p => (p.active ? "#6471C020" : "#fff")};

	&:hover,
	&:focus {
		background: ${p => (p.active ? "#6471C020" : "#f5f6f8")};
	}
`;

const Container = styled.div`
	position: relative;
`;

const Popover = styled.div<{ active: boolean }>`
	margin-top: 10px;
	display: ${p => (p.active ? "block" : "none")};
	position: absolute;
	z-index: 9999;
	background: white;
	box-shadow: 0 4px 5px 0 rgba(22, 29, 37, 0.1);
	border-radius: 4px;
	border: 1px solid #eee;
`;

export default FontPicker;
