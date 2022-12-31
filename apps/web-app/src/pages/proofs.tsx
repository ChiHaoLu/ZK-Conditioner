import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { Subgraph } from "@semaphore-protocol/subgraph"
import { solidityKeccak256 } from "ethers/lib/utils"
import getNextConfig from "next/config"
import { useRouter } from "next/router"
import { useCallback, useContext, useEffect, useState } from "react"
import Stepper from "../components/Stepper"
import LogsContext from "../context/LogsContext"
import SubgraphContext from "../context/SubgraphContext"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"

const { publicRuntimeConfig: env } = getNextConfig()

export default function ProofsPage() {
    const router = useRouter()
    const { setLogs } = useContext(LogsContext)
    const { _feedback, refreshFeedback, addFeedback } = useContext(SubgraphContext)
    const [_loading, setLoading] = useBoolean()
    const [_identity, setIdentity] = useState<Identity>()
    const prefix: string = "zkConditionerRound1"

    useEffect(() => {
        const identityString = localStorage.getItem("identity")

        if (!identityString) {
            router.push("/")
            return
        }

        setIdentity(new Identity(identityString))
    }, [])

    useEffect(() => {
        if (_feedback.length > 0) {
            setLogs(`The result in this round is: ${calculateVoteNum(_feedback)}`)
        }
    }, [_feedback])

    const calculateVoteNum = (arr: any) => {
        let tmp = 0
        arr.forEach((f: string) => {
            if (f.includes(prefix)) {
                if (f.includes("+1")){
                    tmp += 1
                }
                else{
                    tmp -= 1
                } 
            }
        })
        return tmp
    }

    const findValidVoteNum = (arr: any) => {
        let tmp = 0
        arr.forEach((f: string) => {
            if (f.includes(prefix)) {
                tmp += 1
            }
        })
        return tmp
    }

    const sendFeedback = useCallback(async () => {
        if (!_identity) {
            return
        }

        const options = ["zkConditionerRound1+1", "zkConditionerRound1-1"]
        const feedback = prompt(
            'Please vote with below options without quotes: \n1. "zkConditionerRound1+1" \n2. "zkConditionerRound1-1"'
        )
        if (feedback === null) {
            alert("You can input null opinion!")
            return
        } else {
            if (!options.includes(feedback?.toString())) {
                alert('Your opinion is not "zkConditionerRound1+1" or "zkConditionerRound1-1"!')
                return
            }
        }

        if (feedback) {
            setLoading.on()
            setLogs(`Posting your anonymous vote...`)

            try {
                const group = new Group()
                const feedbackHash = solidityKeccak256(["string"], [feedback])

                const subgraph = new Subgraph("goerli")
                const { members } = await subgraph.getGroup(env.GROUP_ID, { members: true })

                group.addMembers(members)

                const { proof, publicSignals } = await generateProof(_identity, group, env.GROUP_ID, feedbackHash)
                const solidityProof = packToSolidityProof(proof)

                const { status } = await fetch("api/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        feedback,
                        merkleRoot: publicSignals.merkleRoot,
                        nullifierHash: publicSignals.nullifierHash,
                        solidityProof
                    })
                })

                if (status === 200) {
                    addFeedback(feedback)

                    setLogs(`Your vote was posted 🎉`)
                } else {
                    setLogs("Some error occurred, please try again!")
                }
            } catch (error) {
                console.error(error)

                setLogs("Some error occurred, please try again!")
            } finally {
                setLoading.off()
            }
        }
    }, [_identity])

    return (
        <>
            <Heading as="h2" size="xl">
                Voting Time
            </Heading>

            <Text pt="2" fontSize="md">
                As a voting round members, voters can anonymously{" "}
                <Link href="https://semaphore.appliedzkp.org/docs/guides/proofs" color="primary.500" isExternal>
                    prove
                </Link>{" "}
                that they are part of a group(current round), and generating their own anonymous opinion(signal, e.g.
                "+1" or "-1").
                <br />
                <br />
                Now, you can vote "+1" or "-1" to any voting round in the valid period(between the valid timestamp).
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            <HStack py="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    Total Votes ({findValidVoteNum(_feedback)})
                </Text>
                <Button leftIcon={<IconRefreshLine />} variant="link" color="text.700" onClick={refreshFeedback}>
                    Refresh
                </Button>
            </HStack>

            <Box pb="5">
                <Button
                    w="100%"
                    fontWeight="bold"
                    justifyContent="left"
                    colorScheme="primary"
                    px="4"
                    onClick={sendFeedback}
                    isDisabled={_loading}
                    leftIcon={<IconAddCircleFill />}
                >
                    Vote your opinion in round 1 (2023/1)
                </Button>
            </Box>

            {_feedback.length > 0 && (
                <VStack spacing="3" align="left">
                    {_feedback.map((f, i) =>
                        f.includes(prefix) ? (
                            <HStack key={i} p="3" borderWidth={1}>
                                <Text>{f.substring(prefix.length)}</Text>
                            </HStack>
                        ) : (
                            ""
                        )
                    )}
                </VStack>
            )}


            <Divider pt="6" borderColor="gray" />

            <Stepper step={3} onPrevClick={() => router.push("/groups")} />
        </>
    )
}
