import { useEffect, useState } from 'react'
import {
    BrowserRouter,
    Link,
    Route,
    Routes,
    useParams,
    useNavigate
} from 'react-router-dom'
import { usePost, useSubreddit } from './Reddit'
import MarkDown from 'react-markdown'

type State = {
    subreddit: string
    subreddit_sort: string
    subreddit_sort_range: string
    post_sort: string
}

type Props = {
    state: State
    updateState: (update: Partial<State>) => void
}

export function App() {
    let [state, setState] = useState<State>({
        subreddit: 'all',
        post_sort: 'top',
        subreddit_sort: 'hot',
        subreddit_sort_range: 'week'
    })

    let updateState = (update: Partial<State>) => {
        setState({ ...state, ...update })
    }

    return (
        <>
            <BrowserRouter>
                <div className='container mx-auto xl:w-[50rem] md:w-[50rem]'>
                    <Link to='/' className=''>
                        <div
                            className='p-8 w-full text-center text-2xl'
                            onClick={() => updateState({ subreddit: 'all' })}
                        >
                            Rapid Reddit
                        </div>
                    </Link>
                    <Routes>
                        <Route
                            path='/'
                            element={
                                <Subreddit
                                    state={state}
                                    updateState={updateState}
                                />
                            }
                        />
                        <Route
                            path='/r/:subreddit'
                            element={
                                <SubRedirect
                                    state={state}
                                    updateState={updateState}
                                />
                            }
                        />
                        <Route
                            path='/:id'
                            element={
                                <ViewPost
                                    state={state}
                                    updateState={updateState}
                                />
                            }
                        />
                    </Routes>
                </div>
            </BrowserRouter>
        </>
    )
}

function SubRedirect({ state, updateState }: Props) {
    let { subreddit } = useParams()
    let nav = useNavigate()

    useEffect(() => {
        updateState({ subreddit: subreddit || 'all' })
        nav('/')
    }, [])

    return <></>
}

function Kind({ kind, data }: any) {
    switch (kind) {
        case 'Listing':
            return <Listing data={data} />
        case 't1':
            return <Comment data={data} />
        case 't3':
            return <Post data={data} />
        default:
            return <></>
    }
}

function Listing({ data }: any) {
    return (
        <>
            {data?.children?.map((x: any, i: number) => (
                <Kind key={i} data={x?.data} kind={x?.kind} />
            ))}
        </>
    )
}

function Subreddit({ state, updateState }: Props) {
    let { subreddit, subError } = useSubreddit(
        state.subreddit,
        state.subreddit_sort,
        state.subreddit_sort_range
    )

    return (
        <>
            <div className='col'>
                <div className='row'>
                    <input
                        type='text'
                        className='bg p-4 outline-none w-full'
                        placeholder='Subreddit'
                        onKeyDown={(e) =>
                            e.key === 'Enter'
                                ? updateState({
                                      subreddit:
                                          e.currentTarget.value.replaceAll(
                                              ' ',
                                              ''
                                          )
                                  })
                                : null
                        }
                    />
                    <select
                        defaultValue={state.subreddit_sort}
                        className='bg p-4 outline-none'
                        onChange={(e) =>
                            updateState({
                                subreddit_sort: e.currentTarget.value
                            })
                        }
                    >
                        {['hot', 'new', 'top'].map((x, i) => (
                            <option value={x} key={i}>
                                {x}
                            </option>
                        ))}
                    </select>
                    {state.subreddit_sort === 'top' && (
                        <>
                            <select
                                defaultValue={state.subreddit_sort_range}
                                className='bg p-4 outline-none'
                                onChange={(e) =>
                                    updateState({
                                        subreddit_sort_range:
                                            e.currentTarget.value
                                    })
                                }
                            >
                                {['hour', 'day', 'week', 'month', 'year'].map(
                                    (x, i) => (
                                        <option value={x} key={i}>
                                            {x}
                                        </option>
                                    )
                                )}
                            </select>
                        </>
                    )}
                </div>
                {subreddit ? (
                    <Kind data={subreddit?.data} kind={subreddit?.kind} />
                ) : (
                    <>{subError ? 'Error!' : <div className='loader'></div>}</>
                )}
            </div>
        </>
    )
}

function Post({ data }: any) {
    let [expanded, setExpanded] = useState(false)
    let toggle = () => setExpanded(!expanded)

    return (
        <>
            <div className='col space-y-2 bg p-4'>
                <div className='col'>
                    <div className='row flex-wrap text-stone-400 text-sm space-x-2'>
                        <div> {data?.score} </div>
                        <Link
                            to={`/r/${data?.subreddit}`}
                            className='hover:text-stone-300'
                        >
                            r/{data?.subreddit}
                        </Link>
                        <div> u/{data?.author} </div>
                        <div>
                            {new Date(data?.created * 1000)
                                .toDateString()
                                .substring(4, 10)}
                        </div>
                    </div>
                    <Link
                        to={`/${data?.id}`}
                        className='row flex-wrap hover:text-stone-300'
                    >
                        <div> {data?.title} </div>
                    </Link>
                </div>
                {data?.thumbnail ? (
                    <div className='row'>
                        {expanded ? (
                            <ThumbnailHandler data={data} toggle={toggle} />
                        ) : (
                            <img
                                onClick={toggle}
                                src={
                                    data?.thumbnail === 'nsfw' ||
                                    data?.thumbnail === 'spoiler'
                                        ? data?.preview?.images?.[0]
                                              ?.resolutions?.[0]?.url
                                        : data.thumbnail
                                }
                                alt=''
                                className='rounded-xl'
                            />
                        )}
                    </div>
                ) : (
                    <>
                        {data?.selftext && (
                            <div
                                className={expanded ? '' : 'text-stone-400'}
                                onClick={toggle}
                            >
                                {expanded ? (
                                    <MarkDown>{data?.selftext}</MarkDown>
                                ) : (
                                    <MarkDown>
                                        {data?.selftext?.length > 300
                                            ? data?.selftext
                                                  ?.substring(0, 250 - 3)
                                                  .padEnd(250, '.')
                                            : data?.selftext}
                                    </MarkDown>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

function ThumbnailHandler({ data, toggle }: any) {
    if (data?.is_video) {
        return (
            <>
                <div>
                    <video
                        autoPlay
                        controls
                        src={data?.media?.reddit_video?.fallback_url}
                    />
                    <span onClick={toggle} className='text-stone-400'>
                        Hide
                    </span>
                </div>
            </>
        )
    }

    if (data?.url) {
        if (`${data?.url}`.endsWith('.gif')) {
            return (
                <>
                    <img
                        onClick={toggle}
                        src={
                            data?.preview?.images?.[0]?.variants?.gif?.source
                                ?.url
                        }
                    />
                </>
            )
        }
    }

    if (`${data?.url}`.endsWith('.gifv')) {
        return (
            <>
                <div>
                    <video
                        autoPlay
                        controls
                        src={`${data?.url}`.replace('.gifv', '.mp4')}
                    />
                    <span onClick={toggle} className='text-stone-400'>
                        Hide
                    </span>
                </div>
            </>
        )
    }

    if (data?.media?.oembed) {
        return (
            <>
                <div>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: data?.media?.oembed?.html
                        }}
                    />
                    <span onClick={toggle} className='text-stone-400'>
                        Hide
                    </span>
                </div>
            </>
        )
    }

    if (data?.preview?.images?.[0]?.source?.url) {
        return (
            <>
                <img
                    onClick={toggle}
                    src={data?.preview?.images?.[0]?.source?.url}
                    alt=''
                    className='rounded-xl'
                />
            </>
        )
    }

    if (data?.is_gallery) {
        return (
            <>
                <img src={data?.thumbnail} alt='' className='rounded-xl' />
            </>
        )
    }

    if (data?.is_self) {
        return (
            <>
                <div className='col'>
                    <MarkDown>{data?.selftext}</MarkDown>
                </div>
            </>
        )
    }

    return <></>
}

function ViewPost({ state, updateState }: Props) {
    let { id } = useParams()
    let { post, postError } = usePost(id!, state.post_sort)

    return (
        <>
            <div className='col'>
                <Kind kind={post?.[0]?.kind} data={post?.[0]?.data} />
                {post ? (
                    <>
                        <div className='row p-1 pl-2 bg w-full space-x-2'>
                            {['best', 'top', 'new', 'controversial'].map(
                                (x, i) => (
                                    <div
                                        className={`${
                                            state.post_sort === x
                                                ? 'text-stone-400'
                                                : 'hover:text-stone-400'
                                        }`}
                                        onClick={() =>
                                            updateState({ post_sort: x })
                                        }
                                        key={i}
                                    >
                                        {x}
                                    </div>
                                )
                            )}
                        </div>
                    </>
                ) : (
                    <>{postError ? 'Error!' : <div className='loader'></div>}</>
                )}
                <Kind kind={post?.[1]?.kind} data={post?.[1]?.data} />
            </div>
        </>
    )
}

function Comment({ data }: any) {
    let [fold, setFold] = useState(data?.stickied ? true : false)

    return (
        <>
            <div className='bg border-l-[0.5px] border-stone-400 pl-2'>
                <div className='p-2'>
                    <div
                        onClick={() => setFold(!fold)}
                        className='row text-stone-400 text-sm space-x-2'
                    >
                        <div> u/{data?.author} </div>
                        <div> {data?.score} </div>
                        <div>
                            {new Date(data?.created * 1000)
                                .toDateString()
                                .substring(4, 10)}
                        </div>
                    </div>
                    {!fold && <MarkDown>{data?.body}</MarkDown>}
                </div>
                {data?.replies && !fold && (
                    <Kind
                        data={data?.replies?.data}
                        kind={data?.replies?.kind}
                    />
                )}
            </div>
        </>
    )
}
