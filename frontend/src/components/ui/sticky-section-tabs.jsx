import React, { Children, isValidElement } from 'react';
import clsx from 'clsx';

const StickyTabItem = ({ title, id, children }) => {
    return null;
};

const StickyTabs = ({
    children,
    mainNavHeight = '4rem',
    // DARK MODE DEFAULTS
    rootClassName = "bg-black text-white",
    navSpacerClassName = "border-b border-white/10 bg-black/80 backdrop-blur",
    sectionClassName = "bg-[#0a0a0a]", // Slightly lighter black for sections
    stickyHeaderContainerClassName = "shadow-md border-b border-white/10 bg-black/90 backdrop-blur",
    headerContentWrapperClassName = "",
    headerContentLayoutClassName = "mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8",
    titleClassName = "my-0 text-xl font-semibold md:text-2xl",
    contentLayoutClassName = "mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8",
}) => {
    const stickyTopValue = `calc(${mainNavHeight} - 1px)`;
    const navHeightStyle = { height: mainNavHeight };
    const stickyHeaderStyle = { top: stickyTopValue };

    return (
        <div className={clsx("overflow-clip", rootClassName)}>

            <div
                className={clsx(
                    "sticky left-0 top-0 z-20 w-full",
                    navSpacerClassName
                )}
                style={navHeightStyle}
                aria-hidden="true"
            />

            {Children.map(children, (child) => {
                if (!isValidElement(child) || child.type !== StickyTabItem) {
                    return null;
                }

                const { title, id, children: itemContent } = child.props;

                return (
                    <section
                        key={id}
                        id={id}
                        className={clsx(
                            "relative overflow-clip min-h-[70vh]",
                            sectionClassName
                        )}
                    >
                        <div
                            className={clsx(
                                "sticky z-10 -mt-px flex flex-col transition-all duration-200",
                                stickyHeaderContainerClassName
                            )}
                            style={stickyHeaderStyle}
                        >
                            <div className={clsx(headerContentWrapperClassName)}>
                                <div className={clsx(headerContentLayoutClassName)}>
                                    <div className="flex items-center justify-between">
                                        <h2 className={clsx(titleClassName)}>
                                            {title}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={clsx(contentLayoutClassName)}>
                            {itemContent}
                        </div>

                    </section>
                );
            })}
        </div>
    );
};

StickyTabs.Item = StickyTabItem;

export default StickyTabs;
